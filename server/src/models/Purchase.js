const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  unitCostPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true }
});

const purchaseSchema = new mongoose.Schema({
  purchaseOrderNumber: { type: String, required: true, unique: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: false },
  items: [purchaseItemSchema],
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' },
  status: { type: String, enum: ['received', 'pending', 'cancelled'], default: 'received' },
  outlet: { type: String, enum: ['Outlet 1', 'Outlet 2'], default: 'Outlet 1' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

purchaseSchema.index({ createdAt: -1 });
purchaseSchema.index({ outlet: 1, createdAt: -1 });
purchaseSchema.index({ supplier: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
