const { body } = require('express-validator');

const purchaseValidator = [
  body('supplier').optional().isMongoId().withMessage('Valid supplier ID is required'),
  body('items').isArray({ min: 1 }).withMessage('Purchase order must contain at least one item'),
  body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitCostPrice').isFloat({ min: 0 }).withMessage('Unit cost price must be a non-negative number'),
  body('paidAmount').optional().isFloat({ min: 0 }).withMessage('Paid amount must be a non-negative number')
];

const supplierPaymentValidator = [
  body('amountPaid').isFloat({ min: 0.01 }).withMessage('Amount paid must be greater than 0'),
  body('paymentMode').optional().isIn(['cash', 'bank_transfer', 'upi', 'cheque']).withMessage('Invalid payment mode')
];

module.exports = { purchaseValidator, supplierPaymentValidator };
