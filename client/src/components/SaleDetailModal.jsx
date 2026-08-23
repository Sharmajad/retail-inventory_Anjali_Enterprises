import React, { useEffect } from 'react';
import { X, Printer, Receipt, Calendar, Clock, User, CreditCard, PackageCheck } from 'lucide-react';
import { printReceipt } from '../utils/printReceipt';

export default function SaleDetailModal({ isOpen, onClose, sale }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !sale) return null;

  const dateObj = new Date(sale.createdAt || Date.now());
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
    printReceipt(sale);
  };

  return (
    <div className="fixed inset-0 bg-[#2B2926]/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="retail-card max-w-2xl w-full p-0 bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-[#FAF9F6] border-b border-[#E8E4DC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#14324B]/10 flex items-center justify-center text-[#14324B]">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-[#14324B]">Sale Details</h2>
                <span className="font-mono text-xs font-bold text-[#14324B] bg-white px-2.5 py-0.5 rounded border border-[#E8E4DC]">
                  {sale.invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-[#2B2926]/60 mt-0.5">Complete transaction summary and material breakdown</p>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-[#2B2926]/40 hover:text-[#D64545] hover:bg-[#D64545]/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
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
                <User className="w-3.5 h-3.5" /> Billed By
              </div>
              <div className="font-semibold text-[#2B2926] truncate">{sale.cashier?.name || 'Store Staff'}</div>
            </div>
            <div>
              <div className="text-[#2B2926]/50 font-medium flex items-center gap-1 mb-1">
                <CreditCard className="w-3.5 h-3.5" /> Payment
              </div>
              <span className="badge-role uppercase font-bold text-[10px] tracking-wide">
                {sale.paymentMethod || 'CASH'}
              </span>
            </div>
          </div>

          {/* Items / Materials Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-bold text-[#14324B] flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-[#2F9E44]" />
                Purchased Materials ({sale.items?.length || 0})
              </h3>
            </div>
            <div className="border border-[#E8E4DC] rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF9F6] border-b border-[#E8E4DC] text-[#2B2926]/70 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Material / Product Name</th>
                    <th className="py-2.5 px-3 text-center">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4DC]">
                  {sale.items && sale.items.length > 0 ? (
                    sale.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF9F6]/50 transition-colors">
                        <td className="py-2.5 px-3 text-center text-[#2B2926]/40 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#2B2926]">
                          {item.productName || item.product?.name || 'Item'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-[#14324B]">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#2B2926]/70">
                          ₹{Number(item.unitPrice || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#14324B]">
                          ₹{Number(item.subtotal || item.quantity * (item.unitPrice || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-[#2B2926]/40">No items in this transaction</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment and Financial Breakdown */}
          <div className="bg-[#FAF9F6] border border-[#E8E4DC] rounded-lg p-4 font-mono text-xs space-y-2">
            <div className="flex justify-between text-[#2B2926]/70">
              <span>Subtotal Amount:</span>
              <span>₹{Number(sale.subtotalAmount || 0).toFixed(2)}</span>
            </div>
            {Number(sale.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-[#D64545]">
                <span>Discount Applied:</span>
                <span>- ₹{Number(sale.discountAmount).toFixed(2)}</span>
              </div>
            )}
            {Number(sale.taxAmount || 0) > 0 && (
              <div className="flex justify-between text-[#2B2926]/70">
                <span>Tax Amount:</span>
                <span>+ ₹{Number(sale.taxAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-[#14324B] pt-2 border-t border-[#E8E4DC] mt-1">
              <span>Grand Total:</span>
              <span>₹{Number(sale.grandTotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#2B2926]/70 pt-2 border-t border-dashed border-[#E8E4DC]">
              <span>Amount Received ({String(sale.paymentMethod || 'cash').toUpperCase()}):</span>
              <span>₹{Number(sale.receivedAmount || sale.grandTotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-[#2F9E44]">
              <span>Change Returned:</span>
              <span>₹{Number(sale.changeAmount || 0).toFixed(2)}</span>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-[#FAF9F6] border-t border-[#E8E4DC] flex items-center justify-end gap-3">
          <button 
            onClick={onClose} 
            className="btn-secondary text-xs px-4 py-2"
          >
            Close
          </button>
          <button 
            onClick={handlePrint} 
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
        </div>

      </div>

      {/* Printable Receipt Layout for window.print() */}
      <div id="printable-receipt" className="hidden print:block font-mono text-sm text-black p-6 max-w-xs mx-auto">
        <div className="text-center mb-4 border-b-2 border-dashed border-gray-300 pb-4">
          <div className="text-xl font-bold uppercase tracking-widest">GLAMOUR POS</div>
          <div className="text-xs text-gray-500 uppercase">Retail Sales Receipt</div>
          <div className="mt-3 text-xs flex justify-between">
            <span>{formattedDate}</span>
            <span>{formattedTime}</span>
          </div>
          <div className="text-xs font-bold text-left mt-1">Invoice: {sale.invoiceNumber}</div>
        </div>

        <table className="w-full text-xs mb-4">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-1">Item</th>
              <th className="text-center py-1">Qty</th>
              <th className="text-right py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sale.items?.map((item, i) => (
              <tr key={i}>
                <td className="py-1.5 pr-2">{item.productName || item.product?.name}</td>
                <td className="text-center py-1.5">{item.quantity} × ₹{item.unitPrice}</td>
                <td className="text-right py-1.5 font-bold">₹{Number(item.subtotal || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t-2 border-dashed border-gray-300 pt-3 space-y-1 text-xs">
          <div className="flex justify-between"><span>Subtotal:</span><span>₹{Number(sale.subtotalAmount || 0).toFixed(2)}</span></div>
          {Number(sale.discountAmount || 0) > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span><span>- ₹{Number(sale.discountAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-2 mt-1">
            <span>TOTAL:</span><span>₹{Number(sale.grandTotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500 border-t-2 border-dashed border-gray-300 pt-2 mt-2">
            <span>Paid ({String(sale.paymentMethod || 'cash').toUpperCase()}):</span>
            <span>₹{Number(sale.receivedAmount || sale.grandTotal || 0).toFixed(2)}</span>
          </div>
          {Number(sale.changeAmount || 0) > 0 && (
            <div className="flex justify-between font-bold">
              <span>Change:</span><span>₹{Number(sale.changeAmount).toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="text-center mt-6 text-xs text-gray-400 border-t border-gray-200 pt-4">
          Thank you for shopping with us!
        </div>
      </div>

    </div>
  );
}
