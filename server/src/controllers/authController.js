const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'super_secret_jwt_key_retail_app_2026_spec',
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const identifier = (req.body.identifier || req.body.email || req.body.phone || '').trim();
  const { password } = req.body;

  try {
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact store owner.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        outlet: user.outlet || (user.role === 'owner' ? 'All' : 'Outlet 1'),
        phone: user.phone,
        mustChangePassword: user.mustChangePassword || false
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.trim().length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword.trim();
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        outlet: user.outlet,
        phone: user.phone,
        mustChangePassword: false
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      outlet: req.user.outlet || (req.user.role === 'owner' ? 'All' : 'Outlet 1'),
      phone: req.user.phone,
      mustChangePassword: req.user.mustChangePassword || false
    }
  });
};

const seedOwner = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Owner seeding route is disabled in production. Use setup script.' });
    }
    const ownerExists = await User.findOne({ role: 'owner' });
    if (ownerExists) {
      return res.status(400).json({ success: false, message: 'Shop owner account already exists' });
    }

    const { name, email, password, phone } = req.body;
    const owner = await User.create({
      name: name || 'Shop Owner',
      email: (email || 'owner@retail.com').toLowerCase(),
      password: password || 'Owner@12345',
      phone: phone || '9876543210',
      role: 'owner',
      isActive: true
    });

    const token = generateToken(owner._id, owner.role);

    res.status(201).json({
      success: true,
      message: 'Shop Owner account seeded successfully!',
      token,
      user: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { login, getMe, seedOwner, changePassword };
