const { validationResult } = require('express-validator');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const SupplierPayment = require('../models/SupplierPayment');
const StockTransaction = require('../models/StockTransaction');

const generatePONumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `PO-${dateStr}-${randomSuffix}`;
};

const createPurchase = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { supplier: supplierId, items, paidAmount = 0, outlet, notes } = req.body;

  try {
    const assignedOutlet = outlet || req.user.outlet || 'Outlet 1';
    let supplier = null;
    if (supplierId) {
      supplier = await Supplier.findById(supplierId);
    }

    const purchaseItems = [];
    let totalAmount = 0;
    const stockTransactionsToCreate = [];
    const productsToSave = [];

    for (const item of items) {
      const product = await Product.findById(item.product).populate('category', 'name');
      if (!product || !product.isActive) {
        return res.status(404).json({ success: false, message: `Product not found or inactive: ${item.product}` });
      }

      if (assignedOutlet === 'Outlet 1' && !/station/i.test(product.category?.name || '')) {
        return res.status(400).json({
          success: false,
          message: `Stationary Outlet is restricted to Stationary products. '${product.name}' is in category '${product.category?.name || 'General'}'.`
        });
      }

      const itemSubtotal = parseFloat(item.unitCostPrice) * parseInt(item.quantity);
      totalAmount += itemSubtotal;

      purchaseItems.push({
        product: product._id,
        productName: product.name,
        quantity: parseInt(item.quantity),
        unitCostPrice: parseFloat(item.unitCostPrice),
        subtotal: itemSubtotal
      });

      const previousStock = product.currentStock;
      const newStock = previousStock + parseInt(item.quantity);

      product.currentStock = newStock;
      product.costPrice = parseFloat(item.unitCostPrice);
      productsToSave.push(product);

      stockTransactionsToCreate.push({
        product: product._id,
        type: 'PURCHASE',
        quantityChange: parseInt(item.quantity),
        previousStock,
        newStock,
        outlet: assignedOutlet,
        reason: supplier ? `Restock via Purchase Order from ${supplier.name} (${assignedOutlet})` : `Stock Restock & Purchase Order (${assignedOutlet})`,
        performedBy: req.user._id
      });
    }

    const numericPaidAmount = parseFloat(paidAmount);
    const balanceDue = Math.max(0, totalAmount - numericPaidAmount);

    let paymentStatus = 'paid';
    if (numericPaidAmount < totalAmount && numericPaidAmount > 0) {
      paymentStatus = 'partial';
    } else if (numericPaidAmount === 0 && totalAmount > 0) {
      paymentStatus = 'paid'; // default paid if supplier is not used
    }

    const purchaseOrderNumber = await generatePONumber();

    const purchase = new Purchase({
      purchaseOrderNumber,
      supplier: supplier ? supplier._id : undefined,
      items: purchaseItems,
      totalAmount,
      paidAmount: numericPaidAmount || totalAmount,
      balanceDue: supplier ? balanceDue : 0,
      paymentStatus,
      status: 'received',
      outlet: assignedOutlet,
      createdBy: req.user._id
    });

    await purchase.save();

    for (const st of stockTransactionsToCreate) st.referenceId = purchase._id;
    await StockTransaction.insertMany(stockTransactionsToCreate);

    for (const p of productsToSave) await p.save();

    if (supplier && balanceDue > 0) {
      supplier.currentBalance += balanceDue;
      await supplier.save();
    }

    if (supplier && numericPaidAmount > 0) {
      await SupplierPayment.create({
        supplier: supplier._id,
        purchase: purchase._id,
        amountPaid: numericPaidAmount,
        paymentMode: 'cash',
        notes: `Upfront payment for PO ${purchaseOrderNumber}`,
        recordedBy: req.user._id
      });
    }

    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate('supplier', 'name contactPerson phone currentBalance')
      .populate('createdBy', 'name email')
      .populate('items.product', 'name barcode unit');

    res.status(201).json({
      success: true,
      message: 'Purchase order created and stock restocked successfully',
      purchase: populatedPurchase
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPurchases = async (req, res) => {
  try {
    const { supplier, paymentStatus, outlet, limit = 50, page = 1 } = req.query;
    const query = {};

    if (supplier) query.supplier = supplier;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (outlet && outlet !== 'All') query.outlet = outlet;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const purchases = await Purchase.find(query)
      .populate('supplier', 'name contactPerson phone')
      .populate('createdBy', 'name')
      .populate('items.product', 'name costPrice unit')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Purchase.countDocuments(query);

    res.status(200).json({
      success: true,
      count: purchases.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      purchases
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier', 'name contactPerson phone email address currentBalance')
      .populate('createdBy', 'name email')
      .populate('items.product', 'name barcode unit');

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    res.status(200).json({ success: true, purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const recordSupplierPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { amountPaid, paymentMode = 'cash', referenceNumber, notes, purchaseId } = req.body;

  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier || !supplier.isActive) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const numericAmount = parseFloat(amountPaid);

    const previousBalance = supplier.currentBalance;
    supplier.currentBalance = Math.max(0, supplier.currentBalance - numericAmount);
    await supplier.save();

    const paymentLog = await SupplierPayment.create({
      supplier: supplier._id,
      purchase: purchaseId || undefined,
      amountPaid: numericAmount,
      paymentMode,
      referenceNumber,
      notes,
      recordedBy: req.user._id
    });

    res.status(200).json({
      success: true,
      message: `Payment of ₹${numericAmount} recorded. Supplier balance updated from ₹${previousBalance} to ₹${supplier.currentBalance}`,
      supplier: {
        id: supplier._id,
        name: supplier.name,
        currentBalance: supplier.currentBalance
      },
      payment: paymentLog
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPurchase,
  getPurchases,
  getPurchaseById,
  recordSupplierPayment
};
