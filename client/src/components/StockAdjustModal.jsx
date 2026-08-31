import React, { useState } from 'react';
import api from '../services/api';
import { X, Save, Archive } from 'lucide-react';

export default function StockAdjustModal({ product, onClose, onSuccess }) {
  const [type, setType] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const adjType = type === 'add' ? 'ADJUSTMENT_ADD' : 'ADJUSTMENT_SUBTRACT';
      await api.post('/inventory/adjust', {
        product: product._id,
        productId: product._id,
        adjustmentType: adjType,
        type: adjType,
        quantity: Number(quantity),
        reason: reason.trim()
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Adjustment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2B2926]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="retail-card max-w-sm w-full p-6 animate-fade-in text-[#2B2926]">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E4DC] mb-4">
          <h2 className="text-lg font-bold text-[#14324B] flex items-center gap-2">
            <Archive className="w-5 h-5" /> Adjust Stock
          </h2>
          <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
        </div>

        <div className="mb-4 bg-[#FAF9F6] p-3 rounded border border-[#E8E4DC]">
          <div className="font-bold text-[#2B2926]">{product.name}</div>
          <div className="text-sm text-[#2B2926]/60 mt-1 font-mono">Current Stock: <span className="font-bold text-[#14324B]">{product.currentStock}</span></div>
        </div>

        {error && <div className="mb-3 text-[#D64545] text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Adjustment Type</label>
            <div className="flex rounded overflow-hidden border border-[#E8E4DC]">
              <button type="button" onClick={() => setType('add')} className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${type === 'add' ? 'bg-[#2F9E44] text-white' : 'bg-white text-[#2B2926]/60 hover:bg-[#FAF9F6]'}`}>
                + Add Stock
              </button>
              <button type="button" onClick={() => setType('subtract')} className={`flex-1 py-2.5 text-sm font-semibold transition-colors border-l border-[#E8E4DC] ${type === 'subtract' ? 'bg-[#D64545] text-white' : 'bg-white text-[#2B2926]/60 hover:bg-[#FAF9F6]'}`}>
                - Remove Stock
              </button>
            </div>
          </div>
          <div>
            <label className="form-label">Quantity *</label>
            <input type="number" min="1" required value={quantity} onChange={e=>setQuantity(e.target.value)} className="form-input font-mono text-lg font-bold" />
          </div>
          <div>
            <label className="form-label">Reason *</label>
            <input type="text" required value={reason} onChange={e=>setReason(e.target.value)} className="form-input" placeholder="e.g. Damaged items, Stock recount..." />
          </div>
          <button type="submit" disabled={submitting} className="w-full btn-primary flex justify-center gap-2">
            <Save className="w-4 h-4" /> Confirm Adjustment
          </button>
        </form>
      </div>
    </div>
  );
}
