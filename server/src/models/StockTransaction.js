const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { 
    type: String, 
    enum: ['SALE', 'PURCHASE', 'ADJUSTMENT_ADD', 'ADJUSTMENT_SUBTRACT', 'RETURN', 'SALE_EDIT_ADJUSTMENT', 'SALE_VOID_REVERSAL'], 
    required: true 
  },
  quantityChange: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  reason: { type: String },
  outlet: { type: String, enum: ['Outlet 1', 'Outlet 2'], default: 'Outlet 1' },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

stockTransactionSchema.index({ product: 1, createdAt: -1 });
stockTransactionSchema.index({ outlet: 1, createdAt: -1 });
stockTransactionSchema.index({ type: 1 });

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
