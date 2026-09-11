const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  barcode: { type: String, unique: true, sparse: true, trim: true },
  name: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subCategory: { type: String, required: false, default: null, trim: true },
  brand: { type: String, trim: true },
  unit: { type: String, default: 'pcs' },
  costPrice: { type: Number, required: false, min: 0 },
  sellingPrice: { type: Number, required: false, min: 0 },
  currentStock: { type: Number, required: true, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.index({ name: 'text', barcode: 'text' });

module.exports = mongoose.model('Product', productSchema);
