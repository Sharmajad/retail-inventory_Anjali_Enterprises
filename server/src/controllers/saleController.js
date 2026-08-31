const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Category = require('../models/Category');
const StockTransaction = require('../models/StockTransaction');

const generateInvoiceNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${randomSuffix}`;
};

const createSale = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { items, paymentMethod = 'cash', discountAmount = 0, taxAmount = 0, receivedAmount, outlet, customerName, customerPhone, notes } = req.body;

  try {
    const assignedOutlet = outlet || req.user.outlet || 'Outlet 1';

    // Enforce Outlet 1 Stationary category restriction
    if (assignedOutlet === 'Outlet 1') {
      const productIds = items.map(i => i.product);
      const fetchedProducts = await Product.find({ _id: { $in: productIds } }).populate('category', 'name');
      for (const prod of fetchedProducts) {
        const catName = prod.category?.name || '';
        if (!/station/i.test(catName)) {
          return res.status(400).json({
            success: false,
            message: `Outlet 1 only sells Stationary items. '${prod.name}' is in category '${catName || 'General'}'.`
          });
        }
      }
    }

    const saleItems = [];
    let subtotalAmount = 0;
    const stockTransactionsToCreate = [];
    const updatedProductsRollback = [];

    // Atomic update pass: Atomically lock and decrement each product's stock in database
    for (const item of items) {
      const quantity = parseInt(item.quantity, 10);
      if (isNaN(quantity) || quantity < 1) {
        // Rollback any earlier products decremented in this batch
        for (const rb of updatedProductsRollback) {
          await Product.findByIdAndUpdate(rb.id, { $inc: { currentStock: rb.qty } });
        }
        return res.status(400).json({ success: false, message: 'Invalid item quantity.' });
      }

      // Atomic conditional decrement: only succeeds if currentStock >= quantity and isActive is true
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, isActive: true, currentStock: { $gte: quantity } },
        { $inc: { currentStock: -quantity } },
        { new: false } // returns document BEFORE update (gives exact previousStock)
      );

      if (!updatedProduct) {
        // Rollback any earlier products decremented in this batch
        for (const rb of updatedProductsRollback) {
          await Product.findByIdAndUpdate(rb.id, { $inc: { currentStock: rb.qty } });
        }

        const existingProduct = await Product.findById(item.product);
        if (!existingProduct || !existingProduct.isActive) {
          return res.status(404).json({ success: false, message: `Product not found or inactive: ${item.product}` });
        }
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${existingProduct.name}'. Available: ${existingProduct.currentStock}, Requested: ${quantity}`
        });
      }

      // Record for rollback if later item fails
      updatedProductsRollback.push({ id: updatedProduct._id, qty: quantity });

      const itemSubtotal = updatedProduct.sellingPrice * quantity;
      subtotalAmount += itemSubtotal;

      saleItems.push({
        product: updatedProduct._id,
        productName: updatedProduct.name,
        quantity,
        unitPrice: updatedProduct.sellingPrice,
        costPrice: updatedProduct.costPrice,
        subtotal: itemSubtotal
      });

      const previousStock = updatedProduct.currentStock;
      const newStock = previousStock - quantity;

      stockTransactionsToCreate.push({
        product: updatedProduct._id,
        type: 'SALE',
        quantityChange: -quantity,
        previousStock,
        newStock,
        outlet: assignedOutlet,
        reason: `POS Sale Checkout (${assignedOutlet})`,
        performedBy: req.user._id
      });
    }

    const grandTotal = Math.max(0, subtotalAmount - parseFloat(discountAmount) + parseFloat(taxAmount));

    if (parseFloat(receivedAmount) < grandTotal) {
      // Rollback stock
      for (const rb of updatedProductsRollback) {
        await Product.findByIdAndUpdate(rb.id, { $inc: { currentStock: rb.qty } });
      }
      return res.status(400).json({
        success: false,
        message: `Received amount (₹${receivedAmount}) is less than Grand Total (₹${grandTotal})`
      });
    }

    const changeAmount = parseFloat(receivedAmount) - grandTotal;
    const invoiceNumber = await generateInvoiceNumber();

    const sale = new Sale({
      invoiceNumber,
      items: saleItems,
      subtotalAmount,
      discountAmount: parseFloat(discountAmount),
      taxAmount: parseFloat(taxAmount),
      grandTotal,
      paymentMethod,
      receivedAmount: parseFloat(receivedAmount),
      changeAmount,
      cashier: req.user._id,
      outlet: assignedOutlet,
      customerName: customerName || 'Walk-in Customer',
      customerPhone,
      notes
    });

    await sale.save();
    for (const st of stockTransactionsToCreate) st.referenceId = sale._id;
    await StockTransaction.insertMany(stockTransactionsToCreate);

    const populatedSale = await Sale.findById(sale._id)
      .populate('cashier', 'name email')
      .populate('items.product', 'name barcode unit');

    res.status(201).json({
      success: true,
      message: 'Sale completed successfully',
      sale: populatedSale
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSales = async (req, res) => {
  try {
    const { startDate, endDate, cashier, outlet, limit = 50, page = 1 } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (cashier) {
      query.cashier = cashier;
    }

    if (outlet && outlet !== 'All') {
      query.outlet = outlet;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sales = await Sale.find(query)
      .populate('cashier', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Sale.countDocuments(query);

    res.status(200).json({
      success: true,
      count: sales.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      sales
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('cashier', 'name email')
      .populate('items.product', 'name barcode unit');

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({ success: true, sale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createSale, getSales, getSaleById };
