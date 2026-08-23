import React, { useEffect } from 'react';
import { CheckCircle2, X, Printer } from 'lucide-react';
import { printReceipt } from '../utils/printReceipt';

/**
 * InvoiceModal — Success toast after checkout with direct Print action.
 * Auto-dismisses after 6 seconds. Has Print Receipt and close buttons.
 */
export default function InvoiceModal({ isOpen, onClose, invoiceData }) {
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [isOpen, onClose]);

  if (!isOpen || !invoiceData) return null;

  const grandTotal = invoiceData.grandTotal ?? 0;
  const payMethod  = invoiceData.paymentMethod ?? '';
  const invoiceNo  = invoiceData.invoiceNumber ?? '';

  const handlePrint = () => {
    printReceipt(invoiceData);
  };

  return (
    <div
      className="fixed top-6 left-1/2 z-[200]"
      style={{ transform: 'translateX(-50%)', animation: 'slideDown 0.35s ease' }}
    >
      <div className="flex items-center gap-4 bg-white border border-[#2F9E44]/40 shadow-2xl rounded-2xl px-5 py-4 min-w-[340px] max-w-sm">
        {/* Icon */}
        <div className="w-11 h-11 rounded-full bg-[#2F9E44]/10 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-6 h-6 text-[#2F9E44]" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[#14324B]">Sale Completed! 🎉</div>
          <div className="text-xs text-[#2B2926]/60 mt-0.5 font-mono">
            {invoiceNo}
          </div>
          <div className="text-sm font-bold text-[#2F9E44] mt-1">
            ₹{grandTotal.toFixed(2)}
            <span className="text-xs font-normal text-[#2B2926]/50 ml-2 uppercase">{payMethod}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={handlePrint}
            title="Print Receipt"
            className="p-1.5 rounded-lg bg-[#14324B]/5 text-[#14324B] hover:bg-[#14324B]/15 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            title="Dismiss"
            className="p-1.5 rounded-lg text-[#2B2926]/30 hover:text-[#D64545] hover:bg-[#D64545]/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="h-1 bg-[#E8E4DC] rounded-full mt-1.5 overflow-hidden">
        <div
          className="h-full bg-[#2F9E44] rounded-full"
          style={{ animation: 'shrinkBar 6s linear forwards' }}
        />
      </div>
    </div>
  );
}
