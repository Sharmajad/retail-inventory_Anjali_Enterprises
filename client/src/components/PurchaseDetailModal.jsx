import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Truck, Calendar, Clock, User, PackageCheck } from 'lucide-react';
import { printPurchaseOrder } from '../utils/printReceipt';

export default function PurchaseDetailModal({ isOpen, onClose, purchase }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !purchase) return null;

  const dateObj = new Date(purchase.createdAt || Date.now());
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const handlePrint = () => {
    printPurchaseOrder(purchase);
  };

  const totalQty = purchase.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0;

  return createPortal(
    <div className="fixed inset-0 bg-[#2B2926]/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="retail-card max-w-2xl w-full p-0 bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-[#FAF9F6] border-b border-[#E8E4DC] relative flex items-center justify-center">
          {/* Centered title block */}
          <div className="flex flex-col items-center text-center gap-1">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <div className="w-8 h-8 rounded-lg bg-[#14324B]/10 flex items-center justify-center text-[#14324B] shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-lg text-[#14324B]">Purchase Order Details</h2>
              <span className="font-mono text-xs font-bold text-[#14324B] bg-white px-2.5 py-0.5 rounded border border-[#E8E4DC]">
                {purchase.purchaseOrderNumber}
              </span>
            </div>
            <p className="text-xs text-[#2B2926]/60">Inventory restocking record</p>
          </div>
          
          {/* Close button anchored to top-right */}
          <button 
            onClick={onClose} 
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#2B2926]/40 hover:text-[#D64545] hover:bg-[#D64545]/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF9F6] p-3.5 rounded-lg border border-[#E8E4DC] text-xs">
            <div>
              <div className="text-[#2B2926]/50 font-medium flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5" /> Date
              </div>
              <div className="font-semibold text-[#2B2926]">{formattedDate}</div>
            </div>
            <div>
              <div className="text-[#2B2926]/50 font-medium flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5" /> Time
              </div>
              <div className="font-semibold text-[#2B2926]">{formattedTime}</div>
            </div>
            <div>
              <div className="text-[#2B2926]/50 font-medium flex items-center gap-1 mb-1">
                <User className="w-3.5 h-3.5" /> Received By
              </div>
              <div className="font-semibold text-[#2B2926] truncate">{purchase.createdBy?.name || 'Store Owner'}</div>
            </div>
            <div>
              <div className="text-[#2B2926]/50 font-medium flex items-center gap-1 mb-1">
                <Truck className="w-3.5 h-3.5" /> Status
              </div>
              <span className="badge-role uppercase font-bold text-[10px] tracking-wide">
                {purchase.status || 'RECEIVED'}
              </span>
            </div>
          </div>

          {/* Items Restocked Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-bold text-[#14324B] flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-[#2F9E44]" />
                Restocked Materials ({purchase.items?.length || 0} items &bull; {totalQty} units)
              </h3>
            </div>
            <div className="border border-[#E8E4DC] rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF9F6] border-b border-[#E8E4DC] text-[#2B2926]/70 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Material / Product</th>
                    <th className="py-2.5 px-3 text-center">Qty Added</th>
                    <th className="py-2.5 px-3 text-right">Unit Cost (₹)</th>
                    <th className="py-2.5 px-3 text-right">Subtotal (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4DC]">
                  {purchase.items && purchase.items.length > 0 ? (
                    purchase.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF9F6]/50 transition-colors">
                        <td className="py-2.5 px-3 text-center text-[#2B2926]/40 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#2B2926]">
                          {item.product?.name || item.productName || 'Product'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-[#2F9E44]">
                          +{item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#2B2926]/70">
                          ₹{Number(item.unitCostPrice || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#14324B]">
                          ₹{Number(item.subtotal || item.quantity * (item.unitCostPrice || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-[#2B2926]/40">No items recorded</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-[#FAF9F6] border border-[#E8E4DC] rounded-lg p-4 font-mono text-xs space-y-2">
            <div className="flex justify-between text-base font-bold text-[#14324B]">
              <span>Total Restock Cost:</span>
              <span>₹{Number(purchase.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#2B2926]/60 pt-2 border-t border-[#E8E4DC]">
              <span>Payment Status:</span>
              <span className="font-bold uppercase text-[#2F9E44]">{purchase.paymentStatus || 'PAID'}</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF9F6] border-t border-[#E8E4DC] flex items-center justify-end gap-3">
          <button 
            onClick={onClose} 
            className="btn-secondary text-xs px-4 py-2 cursor-pointer"
          >
            Close
          </button>
          <button 
            onClick={handlePrint} 
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print PO
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
