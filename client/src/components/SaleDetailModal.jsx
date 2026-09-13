import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Receipt,
  Calendar,
  Clock,
  User,
  CreditCard,
  PackageCheck,
  Edit3,
  AlertOctagon,
  History,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText
} from 'lucide-react';
import { printReceipt } from '../utils/printReceipt';
import { useAuth } from '../context/AuthContext';
import { isSaleWithin2DaysIST } from '../utils/dateUtils';
import EditSaleModal from './EditSaleModal';
import VoidSaleModal from './VoidSaleModal';

export default function SaleDetailModal({ isOpen, onClose, sale, onRefresh }) {
  const { isOwner } = useAuth();
  const [currentSale, setCurrentSale] = useState(sale);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  useEffect(() => {
    setCurrentSale(sale);
    setIsHistoryExpanded(false);
  }, [sale, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isEditModalOpen && !isVoidModalOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isEditModalOpen, isVoidModalOpen]);

  if (!isOpen || !currentSale) return null;

  const dateObj = new Date(currentSale.createdAt || Date.now());
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

  const isVoided = currentSale.status === 'VOIDED';
  const isEdited = currentSale.status === 'EDITED';
  const canEditOrVoid = isOwner && !isVoided && isSaleWithin2DaysIST(currentSale.createdAt);

  const handlePrint = () => {
    printReceipt(currentSale);
  };

  const handleEditSuccess = (updatedSale) => {
    setCurrentSale(updatedSale);
    if (onRefresh) onRefresh();
  };

  const handleVoidSuccess = (updatedSale) => {
    setCurrentSale(updatedSale);
    if (onRefresh) onRefresh();
  };

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 bg-[#2B2926]/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="retail-card max-w-2xl w-full p-0 bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[92vh] border border-[#E8E4DC]">
          
          {/* Header */}
          <div className="px-5 py-4 bg-[#FAF9F6] border-b border-[#E8E4DC] relative flex items-center justify-center">
            {/* Centered title block */}
            <div className="flex flex-col items-center text-center gap-1">
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isVoided ? 'bg-[#D64545]/10 text-[#D64545]' : 'bg-[#14324B]/10 text-[#14324B]'}`}>
                  {isVoided ? <AlertOctagon className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                </div>
                <h2 className="font-bold text-lg text-[#14324B]">Sale Details</h2>
                <span className="font-mono text-xs font-bold text-[#14324B] bg-white px-2.5 py-0.5 rounded border border-[#E8E4DC]">
                  {currentSale.invoiceNumber}
                </span>
                {isEdited && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#D97706] border border-[#F59E0B]/30 flex items-center gap-1">
                    <Edit3 className="w-3 h-3" /> EDITED
                  </span>
                )}
                {isVoided && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D64545]/10 text-[#D64545] border border-[#D64545]/30 flex items-center gap-1">
                    <AlertOctagon className="w-3 h-3" /> VOIDED
                  </span>
                )}
              </div>
              <p className="text-xs text-[#2B2926]/60">
                Complete transaction summary and material breakdown
              </p>
            </div>

            {/* Close button anchored to top-right */}
            <button 
              onClick={onClose} 
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#2B2926]/40 hover:text-[#D64545] hover:bg-[#D64545]/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-5">
            
            {/* VOIDED BANNER */}
            {isVoided && (
              <div className="p-4 rounded-xl bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertOctagon className="w-4 h-4 shrink-0" />
                  <span>THIS SALE HAS BEEN VOIDED</span>
                </div>
                <div className="text-xs space-y-1 bg-white/70 p-3 rounded-lg border border-[#D64545]/20 font-medium">
                  <div>
                    <strong>Void Reason:</strong> <span className="text-[#2B2926]">{currentSale.voidReason || 'No reason specified'}</span>
                  </div>
                  <div className="flex items-center gap-4 pt-1 text-[11px] text-[#2B2926]/70">
                    <span><strong>Voided By:</strong> {currentSale.voidedBy?.name || 'Owner'}</span>
                    <span>
                      <strong>Date:</strong> {currentSale.voidedAt ? new Date(currentSale.voidedAt).toLocaleString('en-IN') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF9F6] p-3.5 rounded-xl border border-[#E8E4DC] text-xs">
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
                <div className="font-semibold text-[#2B2926] truncate">{currentSale.cashier?.name || 'Store Staff'}</div>
              </div>
              <div>
                <div className="text-[#2B2926]/50 font-medium flex items-center gap-1 mb-1">
                  <CreditCard className="w-3.5 h-3.5" /> Payment
                </div>
                <span className="badge-role uppercase font-bold text-[10px] tracking-wide">
                  {currentSale.paymentMethod || 'CASH'}
                </span>
              </div>
            </div>

            {/* Items / Materials Table */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-bold text-[#14324B] flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-[#2F9E44]" />
                  Purchased Materials ({currentSale.items?.length || 0})
                </h3>
              </div>
              <div className="border border-[#E8E4DC] rounded-xl overflow-hidden">
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
                    {currentSale.items && currentSale.items.length > 0 ? (
                      currentSale.items.map((item, idx) => (
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
            <div className="bg-[#FAF9F6] border border-[#E8E4DC] rounded-xl p-4 font-mono text-xs space-y-2">
              <div className="flex justify-between text-[#2B2926]/70">
                <span>Subtotal Amount:</span>
                <span>₹{Number(currentSale.subtotalAmount || 0).toFixed(2)}</span>
              </div>
              {Number(currentSale.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-[#D64545]">
                  <span>Discount Applied:</span>
                  <span>- ₹{Number(currentSale.discountAmount).toFixed(2)}</span>
                </div>
              )}
              {Number(currentSale.taxAmount || 0) > 0 && (
                <div className="flex justify-between text-[#2B2926]/70">
                  <span>Tax Amount:</span>
                  <span>+ ₹{Number(currentSale.taxAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#14324B] pt-2 border-t border-[#E8E4DC] mt-1">
                <span>Grand Total:</span>
                <span>₹{Number(currentSale.grandTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#2B2926]/70 pt-2 border-t border-dashed border-[#E8E4DC]">
                <span>Amount Received ({String(currentSale.paymentMethod || 'cash').toUpperCase()}):</span>
                <span>₹{Number(currentSale.receivedAmount || currentSale.grandTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-[#2F9E44]">
                <span>Change Returned:</span>
                <span>₹{Number(currentSale.changeAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Audit / Edit History Section */}
            {currentSale.editHistory && currentSale.editHistory.length > 0 && (
              <div className="border border-[#F59E0B]/30 rounded-xl overflow-hidden bg-[#FFFBEB]/40">
                <button
                  type="button"
                  onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F59E0B]/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#D97706]" />
                    <span className="text-xs font-bold text-[#B45309]">
                      Audit / Edit History ({currentSale.editHistory.length} edit{currentSale.editHistory.length > 1 ? 's' : ''})
                    </span>
                  </div>
                  {isHistoryExpanded ? <ChevronUp className="w-4 h-4 text-[#D97706]" /> : <ChevronDown className="w-4 h-4 text-[#D97706]" />}
                </button>

                {isHistoryExpanded && (
                  <div className="p-4 border-t border-[#F59E0B]/20 space-y-4 text-xs animate-fade-in">
                    {currentSale.editHistory.map((edit, idx) => (
                      <div key={idx} className="bg-white p-3.5 rounded-lg border border-[#E8E4DC] space-y-2">
                        <div className="flex items-center justify-between border-b border-[#E8E4DC] pb-2">
                          <span className="font-bold text-[#14324B]">Edit #{idx + 1}</span>
                          <span className="text-[11px] text-[#2B2926]/60">
                            {new Date(edit.editedAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#2B2926]/60 font-medium">Reason:</span>{' '}
                          <strong className="text-[#14324B]">"{edit.reason}"</strong>
                        </div>
                        <div className="text-[11px] text-[#2B2926]/60">
                          Edited By: <strong>{edit.editedBy?.name || 'Owner'}</strong>
                        </div>

                        {/* Snapshot Summary comparison */}
                        {edit.beforeSnapshot && edit.afterSnapshot && (
                          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] bg-[#FAF9F6] p-2.5 rounded border border-[#E8E4DC] font-mono">
                            <div>
                              <div className="font-bold text-[#2B2926]/70 mb-1">Before:</div>
                              <div>Total: ₹{Number(edit.beforeSnapshot.grandTotal || 0).toFixed(2)}</div>
                              <div>Items: {edit.beforeSnapshot.items?.length || 0}</div>
                              <div>Payment: {String(edit.beforeSnapshot.paymentMethod || '').toUpperCase()}</div>
                            </div>
                            <div className="border-l border-[#E8E4DC] pl-2">
                              <div className="font-bold text-[#2F9E44] mb-1">After:</div>
                              <div>Total: ₹{Number(edit.afterSnapshot.grandTotal || 0).toFixed(2)}</div>
                              <div>Items: {edit.afterSnapshot.items?.length || 0}</div>
                              <div>Payment: {String(edit.afterSnapshot.paymentMethod || '').toUpperCase()}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer actions */}
          <div className="p-4 bg-[#FAF9F6] border-t border-[#E8E4DC] flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {canEditOrVoid && (
                <>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 font-semibold cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#14324B]" />
                    <span>Edit Sale</span>
                  </button>

                  <button
                    onClick={() => setIsVoidModalOpen(true)}
                    className="px-3 py-2 rounded-lg bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] hover:bg-[#D64545]/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Void Sale</span>
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={onClose} 
                className="btn-secondary text-xs px-4 py-2 cursor-pointer"
              >
                Close
              </button>
              <button 
                onClick={handlePrint} 
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>
          </div>

        </div>

        {/* Printable Receipt Layout for window.print() */}
        <div id="printable-receipt" className="hidden print:block font-mono text-sm text-black p-6 max-w-xs mx-auto">
          <div className="text-center mb-4 border-b-2 border-dashed border-gray-300 pb-4">
            <div className="text-xl font-bold uppercase tracking-widest">ANJALI ENTERPRISES</div>
            <div className="text-xs text-gray-500 uppercase">Retail Sales Receipt</div>
            {isVoided && (
              <div className="text-base font-bold text-red-600 border border-red-600 my-2 py-0.5">
                *** VOIDED TRANSACTION ***
              </div>
            )}
            <div className="mt-3 text-xs flex justify-between">
              <span>{formattedDate}</span>
              <span>{formattedTime}</span>
            </div>
            <div className="text-xs font-bold text-left mt-1">Invoice: {currentSale.invoiceNumber}</div>
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
              {currentSale.items?.map((item, i) => (
                <tr key={i}>
                  <td className="py-1.5 pr-2">{item.productName || item.product?.name}</td>
                  <td className="text-center py-1.5">{item.quantity} × ₹{item.unitPrice}</td>
                  <td className="text-right py-1.5 font-bold">₹{Number(item.subtotal || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t-2 border-dashed border-gray-300 pt-3 space-y-1 text-xs">
            <div className="flex justify-between"><span>Subtotal:</span><span>₹{Number(currentSale.subtotalAmount || 0).toFixed(2)}</span></div>
            {Number(currentSale.discountAmount || 0) > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span><span>- ₹{Number(currentSale.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-2 mt-1">
              <span>TOTAL:</span><span>₹{Number(currentSale.grandTotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 border-t-2 border-dashed border-gray-300 pt-2 mt-2">
              <span>Paid ({String(currentSale.paymentMethod || 'cash').toUpperCase()}):</span>
              <span>₹{Number(currentSale.receivedAmount || currentSale.grandTotal || 0).toFixed(2)}</span>
            </div>
            {Number(currentSale.changeAmount || 0) > 0 && (
              <div className="flex justify-between font-bold">
                <span>Change:</span><span>₹{Number(currentSale.changeAmount).toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="text-center mt-6 text-xs text-gray-400 border-t border-gray-200 pt-4">
            Thank you for shopping with us!
          </div>
        </div>

      </div>,
      document.body
    )}

      {/* Edit Sale Modal */}
      {isEditModalOpen && (
        <EditSaleModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          sale={currentSale}
          onSuccess={handleEditSuccess}
          onRedirectToVoid={(saleToVoid) => {
            setIsEditModalOpen(false);
            setIsVoidModalOpen(true);
          }}
        />
      )}

      {/* Void Sale Modal */}
      {isVoidModalOpen && (
        <VoidSaleModal
          isOpen={isVoidModalOpen}
          onClose={() => setIsVoidModalOpen(false)}
          sale={currentSale}
          onSuccess={handleVoidSuccess}
        />
      )}
    </>
  );
}
