const { body } = require('express-validator');

const loginValidator = [
  body('password').notEmpty().withMessage('Password is required'),
  body().custom((val, { req }) => {
    const id = req.body.identifier || req.body.email || req.body.phone;
    if (!id || String(id).trim().length === 0) {
      throw new Error('Please provide email or phone number');
    }
    return true;
  })
];

const createStaffValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('outlet').isIn(['Outlet 1', 'Outlet 2']).withMessage('Outlet must be Outlet 1 or Outlet 2'),
  body('email').optional().isEmail().withMessage('Valid email is required if provided').normalizeEmail()
];

module.exports = { loginValidator, createStaffValidator };
