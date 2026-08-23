const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');

const getProducts = async (req, res) => {
  try {
    const { category, search, lowStock, limit = 1000, page = 1 } = req.query;
    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    if (lowStock === 'true') {
      query.$expr = { $lte: ['$currentStock', '$lowStockThreshold'] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort('name')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProductByBarcode = async (req, res) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode.trim(), isActive: true })
      .populate('category', 'name');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product with this barcode not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { barcode, name, category, brand, unit, costPrice, sellingPrice, currentStock, lowStockThreshold } = req.body;

  try {
    const categoryExists = await Category.findById(category);
    if (!categoryExists || !categoryExists.isActive) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive category' });
    }

    if (barcode) {
      const barcodeExists = await Product.findOne({ barcode: barcode.trim(), isActive: true });
      if (barcodeExists) {
        return res.status(409).json({ success: false, message: 'Product with this barcode already exists' });
      }
    }

    const product = await Product.create({
      barcode: barcode ? barcode.trim() : undefined,
      name: name.trim(),
      category,
      brand: brand ? brand.trim() : undefined,
      unit: unit || 'pcs',
      costPrice: parseFloat(costPrice),
      sellingPrice: parseFloat(sellingPrice),
      currentStock: currentStock !== undefined ? parseInt(currentStock) : 0,
      lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold) : 5
    });

    const populatedProduct = await Product.findById(product._id).populate('category', 'name');

    res.status(201).json({ success: true, product: populatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { barcode, name, category, brand, unit, costPrice, sellingPrice, currentStock, lowStockThreshold, isActive } = req.body;

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists || !categoryExists.isActive) {
        return res.status(400).json({ success: false, message: 'Invalid or inactive category' });
      }
      product.category = category;
    }

    if (barcode && barcode.trim() !== product.barcode) {
      const barcodeExists = await Product.findOne({ barcode: barcode.trim(), _id: { $ne: product._id }, isActive: true });
      if (barcodeExists) {
        return res.status(409).json({ success: false, message: 'Barcode is already assigned to another product' });
      }
      product.barcode = barcode.trim();
    }

    if (name) product.name = name.trim();
    if (brand !== undefined) product.brand = brand.trim();
    if (unit) product.unit = unit;
    if (costPrice !== undefined) product.costPrice = parseFloat(costPrice);
    if (sellingPrice !== undefined) product.sellingPrice = parseFloat(sellingPrice);
    if (currentStock !== undefined) product.currentStock = parseInt(currentStock);
    if (lowStockThreshold !== undefined) product.lowStockThreshold = parseInt(lowStockThreshold);
    if (typeof isActive === 'boolean') product.isActive = isActive;

    await product.save();
    const updatedProduct = await Product.findById(product._id).populate('category', 'name');

    res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.isActive = false;
    await product.save();
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct
};
