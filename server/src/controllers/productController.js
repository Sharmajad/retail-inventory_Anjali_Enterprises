const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

const getProducts = async (req, res) => {
  try {
    const { category, subCategory, search, lowStock, outlet, limit = 1000, page = 1 } = req.query;
    const isStationaryScoped = (req.user?.role === 'staff' && req.user?.outlet === 'Outlet 1') || outlet === 'Outlet 1';
    const query = { isActive: true };

    if (isStationaryScoped) {
      const stationaryCats = await Category.find({ name: { $regex: /station/i } });
      const catIds = stationaryCats.map(c => c._id);
      query.category = { $in: catIds };
    } else if (category) {
      query.category = category;
    }

    if (subCategory) {
      query.subCategory = subCategory;
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
    const isStationaryScoped = (req.user?.role === 'staff' && req.user?.outlet === 'Outlet 1') || req.query.outlet === 'Outlet 1';
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (isStationaryScoped && !/station/i.test(product.category?.name || '')) {
      return res.status(403).json({ success: false, message: 'Product is not in the Stationary Outlet catalog' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProductByBarcode = async (req, res) => {
  try {
    const isStationaryScoped = (req.user?.role === 'staff' && req.user?.outlet === 'Outlet 1') || req.query.outlet === 'Outlet 1';
    const product = await Product.findOne({ barcode: req.params.barcode.trim(), isActive: true })
      .populate('category', 'name');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product with this barcode not found' });
    }
    if (isStationaryScoped && !/station/i.test(product.category?.name || '')) {
      return res.status(403).json({ success: false, message: 'Product is not in the Stationary Outlet catalog' });
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

  const { barcode, name, category, subCategory, brand, unit, costPrice, sellingPrice, currentStock, lowStockThreshold } = req.body;

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
      subCategory: subCategory ? subCategory.trim() : null,
      brand: brand ? brand.trim() : undefined,
      unit: unit || 'pcs',
      costPrice: (costPrice !== undefined && costPrice !== null && costPrice !== '') ? parseFloat(costPrice) : undefined,
      sellingPrice: (sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== '') ? parseFloat(sellingPrice) : undefined,
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

    const { barcode, name, category, subCategory, brand, unit, costPrice, sellingPrice, currentStock, lowStockThreshold, isActive } = req.body;

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
    if (subCategory !== undefined) product.subCategory = subCategory ? subCategory.trim() : null;
    if (brand !== undefined) product.brand = brand.trim();
    if (unit) product.unit = unit;
    if (costPrice !== undefined) product.costPrice = (costPrice !== null && costPrice !== '') ? parseFloat(costPrice) : undefined;
    if (sellingPrice !== undefined) product.sellingPrice = (sellingPrice !== null && sellingPrice !== '') ? parseFloat(sellingPrice) : undefined;
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

const getSubcategories = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { isActive: true, subCategory: { $nin: [null, ''] } };

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        const catDoc = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
        if (catDoc) {
          query.category = catDoc._id;
        } else {
          return res.status(200).json({ success: true, subcategories: [] });
        }
      }
    }

    const subcategories = await Product.distinct('subCategory', query);
    const cleaned = subcategories
      .filter(s => s && typeof s === 'string' && s.trim().length > 0)
      .map(s => s.trim())
      .sort((a, b) => a.localeCompare(b));

    res.status(200).json({
      success: true,
      subcategories: cleaned
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getSubcategories,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct
};
