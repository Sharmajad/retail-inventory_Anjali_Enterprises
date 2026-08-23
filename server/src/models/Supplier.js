const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contactPerson: { type: String, trim: true },
  phone: { type: String, required: true },
  email: { type: String, lowercase: true, trim: true },
  address: { type: String },
  currentBalance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

supplierSchema.index({ phone: 1 });
supplierSchema.index({ name: 1, isActive: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
