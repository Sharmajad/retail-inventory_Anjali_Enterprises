const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  costPrice: { type: Number, required: false, default: 0 },
  subtotal: { type: Number, required: true }
});

const saleSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  items: [saleItemSchema],
  subtotalAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'split'], default: 'cash' },
  receivedAmount: { type: Number, required: true },
  changeAmount: { type: Number, default: 0 },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  outlet: { type: String, enum: ['Outlet 1', 'Outlet 2'], default: 'Outlet 1' },
  customerName: { type: String, default: 'Walk-in Customer' },
  customerPhone: { type: String },
  notes: { type: String }
}, { timestamps: true });

saleSchema.index({ createdAt: -1 });
saleSchema.index({ outlet: 1, createdAt: -1 });
saleSchema.index({ cashier: 1 });

module.exports = mongoose.model('Sale', saleSchema);
