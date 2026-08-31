const { body } = require('express-validator');

const adjustStockValidator = [
  body().custom((value, { req }) => {
    const prodId = req.body.product || req.body.productId;
    if (!prodId || !prodId.toString().match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error('Valid product ID is required');
    }
    const adjType = req.body.adjustmentType || req.body.type;
    if (!['ADJUSTMENT_ADD', 'ADJUSTMENT_SUBTRACT'].includes(adjType)) {
      throw new Error('Adjustment type must be ADJUSTMENT_ADD or ADJUSTMENT_SUBTRACT');
    }
    const qty = parseInt(req.body.quantity, 10);
    if (isNaN(qty) || qty < 1) {
      throw new Error('Quantity must be at least 1');
    }
    const reason = req.body.reason;
    if (!reason || !reason.trim()) {
      throw new Error('Reason for stock adjustment is required');
    }
    return true;
  })
];

module.exports = { adjustStockValidator };
