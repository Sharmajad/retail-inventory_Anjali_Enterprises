import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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

  return createPortal(
    <div className="fixed inset-0 bg-[#2B2926]/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="retail-card max-w-sm w-full p-0 animate-fade-in text-[#2B2926] shadow-2xl overflow-hidden">
        <div className="px-5 py-4 bg-[#FAF9F6] border-b border-[#E8E4DC] relative flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#14324B]/10 flex items-center justify-center text-[#14324B]">
              <Archive className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-[#14324B]">Adjust Stock</h2>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#2B2926]/40 hover:text-[#D64545] hover:bg-[#D64545]/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 pt-5">

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
    </div>,
    document.body
  );
}
