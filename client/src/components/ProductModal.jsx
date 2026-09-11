import React, { useState } from 'react';
import api from '../services/api';
import { X, Trash2 } from 'lucide-react';

export default function ProductModal({ product, categories, onClose, onSuccess, onDeleteRequest }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category?._id || product?.category || '',
    subCategory: product?.subCategory || '',
    brand: product?.brand || '',
    costPrice: product?.costPrice !== undefined && product?.costPrice !== null ? product.costPrice : '',
    sellingPrice: product?.sellingPrice !== undefined && product?.sellingPrice !== null ? product.sellingPrice : '',
    currentStock: product?.currentStock !== undefined ? product.currentStock : '',
    lowStockThreshold: product?.lowStockThreshold || 5,
    isActive: product?.isActive !== undefined ? product.isActive : true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (product) {
        await api.put(`/products/${product._id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2B2926]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="retail-card max-w-lg w-full p-6 animate-fade-in text-[#2B2926] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E4DC] mb-5">
          <h2 className="text-lg font-bold text-[#14324B]">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
        </div>
        {error && <div className="mb-4 text-[#D64545] text-sm bg-[#D64545]/10 p-3 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Product Name *</label>
            <input type="text" required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="form-input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Category *</label>
              <select required value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="form-input">
                <option value="">Select category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Sub-Category</label>
              <input type="text" placeholder="e.g. Earings, Glass Bangals" value={formData.subCategory} onChange={e=>setFormData({...formData, subCategory: e.target.value})} className="form-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Brand</label>
              <input type="text" value={formData.brand} onChange={e=>setFormData({...formData, brand: e.target.value})} className="form-input" />
            </div>
            <div>
              <label className="form-label">Low Stock Alert</label>
              <input type="number" min="0" value={formData.lowStockThreshold} onChange={e=>setFormData({...formData, lowStockThreshold: e.target.value})} className="form-input font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Cost Price (₹)</label>
              <input type="number" step="0.01" min="0" placeholder="Optional" value={formData.costPrice} onChange={e=>setFormData({...formData, costPrice: e.target.value})} className="form-input font-mono" />
            </div>
            <div>
              <label className="form-label">Selling Price (₹)</label>
              <input type="number" step="0.01" min="0" placeholder="Optional (Required for POS sale)" value={formData.sellingPrice} onChange={e=>setFormData({...formData, sellingPrice: e.target.value})} className="form-input font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="form-label">Opening Stock</label>
              <input type="number" min="0" value={formData.currentStock} onChange={e=>setFormData({...formData, currentStock: e.target.value})} className="form-input font-mono" />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e=>setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 accent-[#14324B]" />
            <label htmlFor="isActive" className="text-sm font-medium">Active Product (visible in POS)</label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {product && onDeleteRequest && (
              <button
                type="button"
                onClick={() => onDeleteRequest(product)}
                className="px-4 py-2.5 rounded-lg border border-[#D64545]/30 text-[#D64545] hover:bg-[#D64545]/10 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
            <button type="submit" disabled={submitting} className="flex-1 btn-primary py-2.5 cursor-pointer">
              {submitting ? 'Saving...' : (product ? 'Save Changes' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
