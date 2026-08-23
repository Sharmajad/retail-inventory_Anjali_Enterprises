const mongoose = require('mongoose');

const supplierPaymentSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
  amountPaid: { type: Number, required: true },
  paymentMode: { type: String, enum: ['cash', 'bank_transfer', 'upi', 'cheque'], default: 'cash' },
  referenceNumber: { type: String },
  notes: { type: String },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('SupplierPayment', supplierPaymentSchema);
