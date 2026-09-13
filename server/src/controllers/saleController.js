const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Category = require('../models/Category');
const StockTransaction = require('../models/StockTransaction');
const { isSaleWithin2DaysIST } = require('../utils/dateUtils');

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
    // Strictly lock staff to their assigned outlet; owner can select outlet or defaults
    const assignedOutlet = req.user.role === 'staff' ? req.user.outlet : (outlet || req.user.outlet || 'Outlet 1');

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
    } else if (assignedOutlet === 'Outlet 2') {
      const productIds = items.map(i => i.product);
      const fetchedProducts = await Product.find({ _id: { $in: productIds } }).populate('category', 'name');
      for (const prod of fetchedProducts) {
        const catName = prod.category?.name || '';
        if (/station/i.test(catName)) {
          return res.status(400).json({
            success: false,
            message: `Outlet 2 does not sell Stationary items. '${prod.name}' is a Stationary item.`
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
        for (const rb of updatedProductsRollback) {
          await Product.findByIdAndUpdate(rb.id, { $inc: { currentStock: rb.qty } });
        }
        return res.status(400).json({ success: false, message: 'Invalid item quantity.' });
      }

      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, isActive: true, currentStock: { $gte: quantity } },
        { $inc: { currentStock: -quantity } },
        { new: false }
      );

      if (!updatedProduct) {
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

      if (updatedProduct.sellingPrice === null || updatedProduct.sellingPrice === undefined || updatedProduct.sellingPrice <= 0) {
        await Product.findByIdAndUpdate(updatedProduct._id, { $inc: { currentStock: quantity } });
        for (const rb of updatedProductsRollback) {
          await Product.findByIdAndUpdate(rb.id, { $inc: { currentStock: rb.qty } });
        }
        return res.status(400).json({
          success: false,
          message: `Selling price not set for this product ('${updatedProduct.name}') — set it before selling.`
        });
      }

      updatedProductsRollback.push({ id: updatedProduct._id, qty: quantity });

      const itemSubtotal = updatedProduct.sellingPrice * quantity;
      subtotalAmount += itemSubtotal;

      saleItems.push({
        product: updatedProduct._id,
        productName: updatedProduct.name,
        quantity,
        unitPrice: updatedProduct.sellingPrice,
        costPrice: updatedProduct.costPrice || 0,
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
      notes,
      status: 'NORMAL'
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
    const { startDate, endDate, cashier, outlet, status, limit = 50, page = 1 } = req.query;
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

    if (status && status !== 'All') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sales = await Sale.find(query)
      .populate('cashier', 'name email')
      .populate('voidedBy', 'name email')
      .populate('editHistory.editedBy', 'name email')
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
      .populate('voidedBy', 'name email')
      .populate('editHistory.editedBy', 'name email')
      .populate('items.product', 'name barcode unit');

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({ success: true, sale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const editSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale invoice not found' });
    }

    if (sale.status === 'VOIDED') {
      return res.status(400).json({ success: false, message: 'Cannot edit a voided sale' });
    }

    // Check 2-day window in Asia/Kolkata timezone from original creation date
    if (!isSaleWithin2DaysIST(sale.createdAt)) {
      return res.status(403).json({
        success: false,
        message: 'Edit window expired. Sales can only be edited within 2 days of original creation.'
      });
    }

    const { items, reason, discountAmount = 0, taxAmount = 0, paymentMethod = sale.paymentMethod, receivedAmount } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Reason for edit is mandatory' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Edited sale must contain at least one item. If removing all items, void the sale instead.'
      });
    }

    // Enforce Outlet 1 Stationary restriction if sale belongs to Outlet 1; Outlet 2 restriction if Outlet 2
    if (sale.outlet === 'Outlet 1') {
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
    } else if (sale.outlet === 'Outlet 2') {
      const productIds = items.map(i => i.product);
      const fetchedProducts = await Product.find({ _id: { $in: productIds } }).populate('category', 'name');
      for (const prod of fetchedProducts) {
        const catName = prod.category?.name || '';
        if (/station/i.test(catName)) {
          return res.status(400).json({
            success: false,
            message: `Outlet 2 does not sell Stationary items. '${prod.name}' is a Stationary item.`
          });
        }
      }
    }

    // Step 4a: Reverse original sale's stock impact
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { currentStock: item.quantity } });
    }

    // Step 4b: Validate new quantities against available stock
    const newSaleItems = [];
    let newSubtotalAmount = 0;
    const stockTransactionsToCreate = [];
    const rollbackAdditions = [];

    // Map existing items to preserve their original cost price
    const existingCostPrices = {};
    sale.items.forEach(it => {
      existingCostPrices[it.product.toString()] = it.costPrice || 0;
    });

    let stockError = null;

    for (const item of items) {
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty < 1) {
        stockError = 'Invalid item quantity';
        break;
      }

      const prod = await Product.findById(item.product);
      if (!prod || !prod.isActive) {
        stockError = `Product not found or inactive: ${item.product}`;
        break;
      }

      if (prod.currentStock < qty) {
        stockError = `Cannot save: insufficient stock for '${prod.name}'. Available: ${prod.currentStock}, Required: ${qty}`;
        break;
      }

      const previousStock = prod.currentStock;
      const newStock = previousStock - qty;
      await Product.findByIdAndUpdate(prod._id, { currentStock: newStock });
      rollbackAdditions.push({ id: prod._id, qty });

      const unitPrice = (item.unitPrice !== undefined && item.unitPrice !== null && Number(item.unitPrice) >= 0)
        ? Number(item.unitPrice)
        : (prod.sellingPrice || 0);

      const subtotal = unitPrice * qty;
      newSubtotalAmount += subtotal;

      const prodIdStr = prod._id.toString();
      const itemCostPrice = existingCostPrices[prodIdStr] !== undefined
        ? existingCostPrices[prodIdStr]
        : (prod.costPrice || 0);

      newSaleItems.push({
        product: prod._id,
        productName: prod.name,
        quantity: qty,
        unitPrice,
        costPrice: itemCostPrice,
        subtotal
      });

      stockTransactionsToCreate.push({
        product: prod._id,
        type: 'SALE_EDIT_ADJUSTMENT',
        quantityChange: -qty,
        previousStock,
        newStock,
        outlet: sale.outlet,
        referenceId: sale._id,
        reason: `Sale Edit Adjustment: ${reason.trim()}`,
        performedBy: req.user._id
      });
    }

    if (stockError) {
      for (const rb of rollbackAdditions) {
        await Product.findByIdAndUpdate(rb.id, { $inc: { currentStock: rb.qty } });
      }
      for (const item of sale.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { currentStock: -item.quantity } });
      }
      return res.status(400).json({ success: false, message: stockError });
    }

    const discountVal = parseFloat(discountAmount) || 0;
    const taxVal = parseFloat(taxAmount) || 0;
    const newGrandTotal = Math.max(0, newSubtotalAmount - discountVal + taxVal);
    const recAmount = receivedAmount !== undefined ? parseFloat(receivedAmount) : newGrandTotal;
    const newChangeAmount = Math.max(0, recAmount - newGrandTotal);

    const beforeSnapshot = {
      items: sale.items.map(it => ({
        product: it.product,
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        costPrice: it.costPrice,
        subtotal: it.subtotal
      })),
      subtotalAmount: sale.subtotalAmount,
      discountAmount: sale.discountAmount,
      taxAmount: sale.taxAmount,
      grandTotal: sale.grandTotal,
      paymentMethod: sale.paymentMethod
    };

    const afterSnapshot = {
      items: newSaleItems.map(it => ({
        product: it.product,
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        costPrice: it.costPrice,
        subtotal: it.subtotal
      })),
      subtotalAmount: newSubtotalAmount,
      discountAmount: discountVal,
      taxAmount: taxVal,
      grandTotal: newGrandTotal,
      paymentMethod
    };

    sale.items = newSaleItems;
    sale.subtotalAmount = newSubtotalAmount;
    sale.discountAmount = discountVal;
    sale.taxAmount = taxVal;
    sale.grandTotal = newGrandTotal;
    sale.paymentMethod = paymentMethod;
    sale.receivedAmount = recAmount;
    sale.changeAmount = newChangeAmount;
    sale.status = 'EDITED';

    sale.editHistory.push({
      editedBy: req.user._id,
      editedAt: new Date(),
      reason: reason.trim(),
      beforeSnapshot,
      afterSnapshot
    });

    await sale.save();
    await StockTransaction.insertMany(stockTransactionsToCreate);

    const populatedSale = await Sale.findById(sale._id)
      .populate('cashier', 'name email')
      .populate('editHistory.editedBy', 'name email')
      .populate('items.product', 'name barcode unit');

    res.status(200).json({
      success: true,
      message: 'Sale updated successfully',
      sale: populatedSale
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const voidSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale invoice not found' });
    }

    if (sale.status === 'VOIDED') {
      return res.status(400).json({ success: false, message: 'This sale is already voided' });
    }

    if (!isSaleWithin2DaysIST(sale.createdAt)) {
      return res.status(403).json({
        success: false,
        message: 'Void window expired. Sales can only be voided within 2 days of original creation.'
      });
    }

    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Reason for voiding is mandatory' });
    }

    const stockTransactionsToCreate = [];
    for (const item of sale.items) {
      const prod = await Product.findById(item.product);
      const previousStock = prod ? prod.currentStock : 0;
      const newStock = previousStock + item.quantity;

      if (prod) {
        prod.currentStock = newStock;
        await prod.save();
      }

      stockTransactionsToCreate.push({
        product: item.product,
        type: 'SALE_VOID_REVERSAL',
        quantityChange: item.quantity,
        previousStock,
        newStock,
        outlet: sale.outlet,
        referenceId: sale._id,
        reason: `Voided Sale Reversal: ${reason.trim()}`,
        performedBy: req.user._id
      });
    }

    if (stockTransactionsToCreate.length > 0) {
      await StockTransaction.insertMany(stockTransactionsToCreate);
    }

    sale.status = 'VOIDED';
    sale.voidedBy = req.user._id;
    sale.voidedAt = new Date();
    sale.voidReason = reason.trim();
    await sale.save();

    const populatedSale = await Sale.findById(sale._id)
      .populate('cashier', 'name email')
      .populate('voidedBy', 'name email')
      .populate('editHistory.editedBy', 'name email')
      .populate('items.product', 'name barcode unit');

    res.status(200).json({
      success: true,
      message: 'Sale has been successfully voided and stock restored',
      sale: populatedSale
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createSale, getSales, getSaleById, editSale, voidSale };
