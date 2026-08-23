const { validationResult } = require('express-validator');
const Supplier = require('../models/Supplier');

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).sort('name');
    res.status(200).json({ success: true, count: suppliers.length, suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier || !supplier.isActive) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.status(200).json({ success: true, supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSupplier = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, contactPerson, phone, email, address, openingBalance } = req.body;

  try {
    const supplier = await Supplier.create({
      name: name.trim(),
      contactPerson,
      phone: phone.trim(),
      email,
      address,
      currentBalance: openingBalance || 0
    });

    res.status(201).json({ success: true, supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const { name, contactPerson, phone, email, address, currentBalance } = req.body;
    if (name) supplier.name = name.trim();
    if (contactPerson !== undefined) supplier.contactPerson = contactPerson;
    if (phone) supplier.phone = phone.trim();
    if (email !== undefined) supplier.email = email;
    if (address !== undefined) supplier.address = address;
    if (currentBalance !== undefined) supplier.currentBalance = currentBalance;

    await supplier.save();
    res.status(200).json({ success: true, supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    supplier.isActive = false;
    await supplier.save();
    res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier };
