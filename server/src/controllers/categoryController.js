const { validationResult } = require('express-validator');
const Category = require('../models/Category');

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('name');
    res.status(200).json({ success: true, count: categories.length, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, description } = req.body;

  try {
    const categoryExists = await Category.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (categoryExists) {
      if (!categoryExists.isActive) {
        categoryExists.isActive = true;
        categoryExists.description = description || categoryExists.description;
        await categoryExists.save();
        return res.status(200).json({ success: true, message: 'Category reactivated', category: categoryExists });
      }
      return res.status(409).json({ success: false, message: 'Category with this name already exists' });
    }

    const category = await Category.create({ name: name.trim(), description });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { name, description, isActive } = req.body;
    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (typeof isActive === 'boolean') category.isActive = isActive;

    await category.save();
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category.isActive = false;
    await category.save();
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
