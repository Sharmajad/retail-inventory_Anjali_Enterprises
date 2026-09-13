const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createStaff = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, phone, outlet } = req.body;

  try {
    const trimmedPhone = String(phone).trim();
    const phoneExists = await User.findOne({ phone: trimmedPhone });
    if (phoneExists) {
      return res.status(409).json({
        success: false,
        message: `Phone number '${trimmedPhone}' is already registered. Phone numbers cannot be reused, even if the account is deactivated.`
      });
    }

    if (email && email.trim()) {
      const emailExists = await User.findOne({ email: email.trim().toLowerCase() });
      if (emailExists) {
        return res.status(409).json({ success: false, message: 'User with this email already exists' });
      }
    }

    if (!['Outlet 1', 'Outlet 2'].includes(outlet)) {
      return res.status(400).json({ success: false, message: 'Outlet must be Outlet 1 or Outlet 2' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email && email.trim() ? email.trim().toLowerCase() : undefined,
      password,
      phone: trimmedPhone,
      role: 'staff',
      outlet,
      isActive: true,
      mustChangePassword: false
    });

    res.status(201).json({
      success: true,
      message: 'Staff account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        outlet: user.outlet,
        phone: user.phone,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, phone, outlet, password, isActive } = req.body;
    if (name) user.name = name.trim();
    if (phone && phone.trim() !== user.phone) {
      const phoneExists = await User.findOne({ phone: phone.trim(), _id: { $ne: user._id } });
      if (phoneExists) {
        return res.status(409).json({ success: false, message: 'Phone number is already taken by another account.' });
      }
      user.phone = phone.trim();
    }
    if (outlet && user.role !== 'owner') {
      if (!['Outlet 1', 'Outlet 2'].includes(outlet)) {
        return res.status(400).json({ success: false, message: 'Invalid outlet' });
      }
      user.outlet = outlet;
    }
    if (password && password.trim().length >= 6) {
      user.password = password.trim();
    }
    if (typeof isActive === 'boolean' && user.role !== 'owner') {
      user.isActive = isActive;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        outlet: user.outlet,
        phone: user.phone,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'owner') {
      return res.status(400).json({ success: false, message: 'Cannot deactivate shop owner account' });
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({ success: true, message: 'Staff account deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const reactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = true;
    await user.save();

    res.status(200).json({ success: true, message: 'Staff account reactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetStaffPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'owner') {
      return res.status(400).json({ success: false, message: 'Cannot reset owner password through staff reset' });
    }

    // Generate readable, secure temporary password e.g. Pass@7k39b
    const randHex = crypto.randomBytes(3).toString('hex');
    const tempPassword = `Pass@${randHex}`;

    user.password = tempPassword;
    user.mustChangePassword = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Temporary password generated successfully',
      tempPassword,
      userName: user.name,
      userPhone: user.phone
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUsers,
  createStaff,
  updateUser,
  deactivateUser,
  reactivateUser,
  resetStaffPassword
};
