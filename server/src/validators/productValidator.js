const { body } = require('express-validator');

const productValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').notEmpty().withMessage('Category is required').isMongoId().withMessage('Invalid Category ID'),
  body('costPrice').isFloat({ min: 0 }).withMessage('Cost price must be a non-negative number'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be a non-negative number'),
  body('currentStock').optional().isInt({ min: 0 }).withMessage('Current stock must be a non-negative integer'),
  body('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('Low stock threshold must be a non-negative integer')
];

module.exports = { productValidator };
