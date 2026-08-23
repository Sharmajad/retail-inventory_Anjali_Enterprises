const { body } = require('express-validator');

const adjustStockValidator = [
  body('product').isMongoId().withMessage('Valid product ID is required'),
  body('adjustmentType').isIn(['ADJUSTMENT_ADD', 'ADJUSTMENT_SUBTRACT']).withMessage('Adjustment type must be ADJUSTMENT_ADD or ADJUSTMENT_SUBTRACT'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('reason').trim().notEmpty().withMessage('Reason for stock adjustment is required')
];

module.exports = { adjustStockValidator };
