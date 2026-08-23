const { body } = require('express-validator');

const supplierValidator = [
  body('name').trim().notEmpty().withMessage('Supplier name is required'),
  body('phone').trim().notEmpty().withMessage('Supplier phone is required')
];

module.exports = { supplierValidator };
