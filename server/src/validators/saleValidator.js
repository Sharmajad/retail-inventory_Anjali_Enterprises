const { body } = require('express-validator');

const saleValidator = [
  body('items').isArray({ min: 1 }).withMessage('Sale must contain at least one item'),
  body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('paymentMethod').optional().isIn(['cash', 'card', 'upi', 'split']).withMessage('Invalid payment method'),
  body('receivedAmount').isFloat({ min: 0 }).withMessage('Received amount is required')
];

module.exports = { saleValidator };
