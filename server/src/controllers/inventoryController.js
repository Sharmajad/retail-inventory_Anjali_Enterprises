const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const StockTransaction = require('../models/StockTransaction');

const adjustStock = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const productId = req.body.product || req.body.productId;
  const adjustmentType = req.body.adjustmentType || req.body.type;
  const quantity = parseInt(req.body.quantity, 10);
  const reason = (req.body.reason || '').trim();
  const outlet = req.body.outlet || (req.user?.outlet && req.user.outlet !== 'All' ? req.user.outlet : 'Outlet 1');

  try {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousStock = product.currentStock;
    const qtyChange = adjustmentType === 'ADJUSTMENT_ADD' ? quantity : -quantity;
    const newStock = previousStock + qtyChange;

    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot subtract ${quantity} items. Current stock is ${previousStock}`
      });
    }

    product.currentStock = newStock;
    await product.save();

    const transaction = await StockTransaction.create({
      product: product._id,
      type: adjustmentType,
      quantityChange: qtyChange,
      previousStock,
      newStock,
      outlet,
      reason,
      performedBy: req.user._id
    });

    const populatedTransaction = await StockTransaction.findById(transaction._id)
      .populate('product', 'name barcode unit')
      .populate('performedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: `Stock successfully updated from ${previousStock} to ${newStock}`,
      product: {
        id: product._id,
        name: product.name,
        currentStock: product.currentStock
      },
      transaction: populatedTransaction
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStockTransactions = async (req, res) => {
  try {
    const { product, type, startDate, endDate, limit = 50, page = 1 } = req.query;
    const query = {};

    if (product) query.product = product;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const transactions = await StockTransaction.find(query)
      .populate('product', 'name barcode unit')
      .populate('performedBy', 'name email role')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StockTransaction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLowStockProducts = async (req, res) => {
  try {
    const isStationaryScoped = (req.user?.role === 'staff' && req.user?.outlet === 'Outlet 1') || req.query.outlet === 'Outlet 1';
    let lowStockProducts = await Product.find({
      isActive: true,
      $expr: { $lte: ['$currentStock', '$lowStockThreshold'] }
    }).populate('category', 'name').sort('currentStock');

    if (isStationaryScoped) {
      lowStockProducts = lowStockProducts.filter(p => /station/i.test(p.category?.name || ''));
    }

    res.status(200).json({
      success: true,
      count: lowStockProducts.length,
      products: lowStockProducts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { adjustStock, getStockTransactions, getLowStockProducts };
