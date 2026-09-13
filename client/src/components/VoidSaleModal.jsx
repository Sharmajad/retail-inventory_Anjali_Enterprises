import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { AlertOctagon, X, Check, AlertCircle } from 'lucide-react';

export default function VoidSaleModal({ isOpen, onClose, sale, onSuccess }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !sale) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a mandatory reason for voiding this sale.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.put(`/sales/${sale._id}/void`, { reason: reason.trim() });
      if (res.data.success) {
        if (onSuccess) onSuccess(res.data.sale);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to void sale. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-[#2B2926]/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
      <div className="retail-card max-w-md w-full bg-white rounded-2xl shadow-2xl p-0 animate-fade-in border border-[#E8E4DC]">
        
        <div className="px-5 py-4 bg-[#FAF9F6] border-b border-[#E8E4DC] relative flex items-center justify-center rounded-t-2xl">
          <div className="flex items-center gap-2.5 text-[#D64545]">
            <AlertOctagon className="w-5 h-5 shrink-0" />
            <h3 className="font-bold text-base text-[#14324B]">Void Sale Invoice</h3>
          </div>
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded text-[#2B2926]/40 hover:text-[#D64545] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-4">
          <div className="p-3.5 rounded-xl bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] text-xs space-y-1 mb-4">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Permanent Void Warning</span>
            </div>
            <p className="leading-relaxed opacity-90">
              Voiding invoice <strong className="font-mono">{sale.invoiceNumber}</strong> will reverse all item quantities back to active inventory stock. The record will be permanently marked as <strong>VOIDED</strong> and excluded from all financial reports.
            </p>
          </div>

          <div className="mb-4 bg-[#FAF9F6] p-3 rounded-lg border border-[#E8E4DC] text-xs font-mono space-y-1">
            <div className="flex justify-between">
              <span className="text-[#2B2926]/60">Invoice Total:</span>
              <span className="font-bold text-[#14324B]">₹{Number(sale.grandTotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#2B2926]/60">Total Items:</span>
              <span>{sale.items?.length || 0} line items</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label text-xs font-semibold flex items-center justify-between">
                <span>Reason for Voiding *</span>
                <span className="text-[10px] text-[#D64545] font-bold">Mandatory</span>
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Customer cancelled order / Entered by mistake / Incorrect billing..."
                className="form-input text-xs"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E4DC]">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs py-2 px-4 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !reason.trim()}
                className="py-2 px-4 rounded-lg bg-[#D64545] text-white text-xs font-bold hover:bg-[#b83232] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {submitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Confirm Void Sale</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>,
    document.body
  );
}
