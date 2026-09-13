import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import {
  Edit3,
  X,
  Trash2,
  Plus,
  AlertCircle,
  AlertTriangle,
  Lock,
  Save,
  Search,
  ShoppingCart,
  DollarSign
} from 'lucide-react';

export default function EditSaleModal({ isOpen, onClose, sale, onSuccess, onRedirectToVoid }) {
  const [items, setItems] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [reason, setReason] = useState('');

  // Catalog for adding new products
  const [availableProducts, setAvailableProducts] = useState([]);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [prodSearch, setProdSearch] = useState('');

  // Empty Cart Confirmation Warning Modal
  const [showEmptyCartWarning, setShowEmptyCartWarning] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sale) {
      setItems((sale.items || []).map(i => ({
        product: i.product?._id || i.product,
        productName: i.productName || i.product?.name || 'Product',
        unitPrice: Number(i.unitPrice || 0),
        costPrice: Number(i.costPrice || 0),
        quantity: Number(i.quantity || 1)
      })));
      setDiscountAmount(sale.discountAmount || 0);
      setPaymentMethod(sale.paymentMethod || 'cash');
      setReceivedAmount(sale.receivedAmount !== undefined ? String(sale.receivedAmount) : '');
      setReason('');
      setError('');
    }
  }, [sale, isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Load active products for the picker
      api.get('/products')
        .then(res => {
          if (res.data.success) {
            let prods = res.data.products.filter(p => p.isActive);
            // If sale belongs to Outlet 1, only show Stationary products; for Outlet 2, exclude Stationary
            if (sale?.outlet === 'Outlet 1') {
              prods = prods.filter(p => /station/i.test(p.category?.name || ''));
            } else if (sale?.outlet === 'Outlet 2') {
              prods = prods.filter(p => !/station/i.test(p.category?.name || ''));
            }
            setAvailableProducts(prods);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, sale]);

  if (!isOpen || !sale) return null;

  const subtotal = items.reduce((acc, item) => acc + (Number(item.unitPrice) * Number(item.quantity)), 0);
  const totalDiscount = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
  const grandTotal = Math.max(0, subtotal - totalDiscount);

  const handleQuantityChange = (index, delta) => {
    const updated = [...items];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(index);
    } else {
      updated[index].quantity = newQty;
      setItems(updated);
    }
  };

  const handlePriceChange = (index, val) => {
    const updated = [...items];
    updated[index].unitPrice = Math.max(0, parseFloat(val) || 0);
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = items.filter((_, idx) => idx !== index);
    if (updated.length === 0) {
      // Prompt empty cart warning
      setShowEmptyCartWarning(true);
    } else {
      setItems(updated);
    }
  };

  const handleAddProduct = (product) => {
    const existingIndex = items.findIndex(i => String(i.product) === String(product._id));
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          product: product._id,
          productName: product.name,
          unitPrice: Number(product.sellingPrice || 0),
          costPrice: Number(product.costPrice || 0),
          quantity: 1
        }
      ]);
    }
    setIsAddProductOpen(false);
    setProdSearch('');
  };

  const handleConfirmEmptyCartVoid = () => {
    setShowEmptyCartWarning(false);
    onClose();
    if (onRedirectToVoid) onRedirectToVoid(sale);
  };

  const handleCancelEmptyCart = () => {
    setShowEmptyCartWarning(false);
    // Do not remove items, preserve current state
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setShowEmptyCartWarning(true);
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a mandatory reason for this edit.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        items: items.map(i => ({
          product: i.product,
          unitPrice: i.unitPrice,
          quantity: i.quantity
        })),
        discountAmount: totalDiscount,
        taxAmount: 0,
        paymentMethod,
        receivedAmount: paymentMethod === 'cash' ? (Number(receivedAmount) || grandTotal) : grandTotal,
        reason: reason.trim()
      };

      const res = await api.put(`/sales/${sale._id}`, payload);
      if (res.data.success) {
        if (onSuccess) onSuccess(res.data.sale);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update sale.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = availableProducts.filter(p =>
    p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
    (p.barcode && p.barcode.includes(prodSearch))
  );

  return createPortal(
    <>
      <div className="fixed inset-0 bg-[#2B2926]/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="retail-card max-w-2xl w-full p-0 bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[92vh] border border-[#E8E4DC]">
          
          {/* Header */}
          <div className="px-5 py-4 bg-[#FAF9F6] border-b border-[#E8E4DC] relative flex items-center justify-center">
            {/* Centered title block */}
            <div className="flex flex-col items-center text-center gap-1">
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <div className="w-8 h-8 rounded-lg bg-[#14324B]/10 text-[#14324B] flex items-center justify-center shrink-0">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-lg text-[#14324B]">Edit Sale Transaction</h2>
                <span className="font-mono text-xs font-bold text-[#14324B] bg-white px-2.5 py-0.5 rounded border border-[#E8E4DC]">
                  {sale.invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-[#2B2926]/60">
                Modify items, quantities, price overrides, discount, and payment method.
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

          {/* Scrollable Form Body */}
          <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-6 flex-1">

            {error && (
              <div className="p-3.5 rounded-xl bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Locked Meta Information */}
            <div className="bg-[#FAF9F6] p-3.5 rounded-xl border border-[#E8E4DC] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[#2B2926]/50 flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3" /> Invoice No.
                </span>
                <span className="font-mono font-bold text-[#14324B]">{sale.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-[#2B2926]/50 flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3" /> Sale Date
                </span>
                <span className="font-semibold text-[#2B2926]">
                  {new Date(sale.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[#2B2926]/50 flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3" /> Outlet
                </span>
                <span className="font-semibold text-[#14324B]">
                  {sale.outlet === 'Outlet 1' ? 'Stationary Outlet' : (sale.outlet || 'Stationary Outlet')}
                </span>
              </div>
              <div>
                <span className="text-[#2B2926]/50 flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3" /> Customer
                </span>
                <span className="font-semibold text-[#2B2926] truncate block">
                  {sale.customerName || 'Walk-in Customer'}
                </span>
              </div>
            </div>

            {/* Items Table with Add Item Control */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-bold text-[#14324B] flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-[#2F9E44]" />
                  Items in Sale ({items.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(true)}
                  className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Product
                </button>
              </div>

              <div className="border border-[#E8E4DC] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F6] border-b border-[#E8E4DC] text-[#2B2926]/70 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-2 text-center w-28">Quantity</th>
                      <th className="py-2.5 px-3 text-right w-24">Price (₹)</th>
                      <th className="py-2.5 px-3 text-right w-24">Subtotal</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E4DC]">
                    {items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF9F6]/40 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#2B2926]">
                          {it.productName}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <div className="inline-flex items-center border border-[#E8E4DC] rounded bg-white">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(idx, -1)}
                              className="px-2 py-0.5 text-xs text-[#2B2926]/60 hover:text-[#D64545] cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold px-2 text-[#14324B]">
                              {it.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(idx, 1)}
                              className="px-2 py-0.5 text-xs text-[#2B2926]/60 hover:text-[#2F9E44] cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={it.unitPrice}
                            onChange={e => handlePriceChange(idx, e.target.value)}
                            className="form-input text-right py-0.5 px-1.5 text-xs font-mono w-20 inline-block"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#14324B]">
                          ₹{(it.unitPrice * it.quantity).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded text-[#2B2926]/40 hover:text-[#D64545] cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Adjustments Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF9F6] p-4 rounded-xl border border-[#E8E4DC]">
              <div className="space-y-3">
                <div>
                  <label className="form-label text-xs">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="form-input text-xs font-semibold"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / QR Code</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="split">Split Payment</option>
                  </select>
                </div>

                <div>
                  <label className="form-label text-xs">Discount Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={discountAmount}
                    onChange={e => setDiscountAmount(e.target.value)}
                    className="form-input text-xs font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Summary calculation */}
              <div className="font-mono text-xs space-y-2 border-l sm:border-[#E8E4DC] sm:pl-4">
                <div className="flex justify-between text-[#2B2926]/70">
                  <span>Subtotal Amount:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#D64545]">
                  <span>Discount:</span>
                  <span>- ₹{totalDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#14324B] pt-2 border-t border-[#E8E4DC]">
                  <span>Updated Grand Total:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Mandatory Reason Input */}
            <div>
              <label className="form-label text-xs font-semibold flex items-center justify-between">
                <span>Reason for Edit *</span>
                <span className="text-[10px] text-[#D64545] font-bold">Mandatory for Audit</span>
              </label>
              <textarea
                required
                rows={2}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Corrected quantity / Customer returned 1 item / Discount correction..."
                className="form-input text-xs"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E4DC]">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs py-2.5 px-4 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !reason.trim() || items.length === 0}
                className="btn-primary text-xs py-2.5 px-5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Sale Changes</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>

      {/* Add Product Sub-Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[250] flex items-center justify-center p-4">
          <div className="retail-card max-w-md w-full bg-white rounded-xl shadow-2xl p-5 animate-fade-in border border-[#E8E4DC]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E4DC] mb-3">
              <h4 className="font-bold text-sm text-[#14324B] flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add Product to Sale
              </h4>
              <button onClick={() => setIsAddProductOpen(false)} className="btn-icon cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative mb-3">
              <input
                type="text"
                value={prodSearch}
                onChange={e => setProdSearch(e.target.value)}
                placeholder="Search products by name or barcode..."
                className="form-input pl-9 text-xs"
                autoFocus
              />
              <Search className="w-4 h-4 text-[#2B2926]/40 absolute left-3 top-3" />
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-[#E8E4DC] border border-[#E8E4DC] rounded-lg">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#2B2926]/50">No matching products found.</div>
              ) : (
                filteredProducts.map(prod => (
                  <div
                    key={prod._id}
                    onClick={() => handleAddProduct(prod)}
                    className="p-2.5 flex items-center justify-between hover:bg-[#FAF9F6] cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-xs text-[#2B2926]">{prod.name}</div>
                      <div className="text-[10px] text-[#2B2926]/50">Stock: {prod.currentStock} {prod.unit || 'pcs'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-[#14324B]">₹{Number(prod.sellingPrice || 0).toFixed(2)}</div>
                      <span className="text-[10px] text-[#2F9E44] font-semibold">+ Add</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal when removing all items (Zero quantity) */}
      {showEmptyCartWarning && (
        <div className="fixed inset-0 bg-[#2B2926]/70 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="retail-card max-w-sm w-full bg-white rounded-2xl shadow-2xl p-6 text-center animate-fade-in border border-[#E8E4DC]">
            <div className="w-12 h-12 rounded-xl bg-[#D64545]/10 text-[#D64545] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#14324B]">Empty Cart Notice</h4>
            <p className="text-xs text-[#2B2926]/70 my-3 leading-relaxed">
              Removing all items will void this sale. Do you want to void it instead?
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelEmptyCart}
                className="btn-secondary text-xs py-2 px-3 cursor-pointer"
              >
                No, Return to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmEmptyCartVoid}
                className="py-2 px-3 rounded-lg bg-[#D64545] text-white text-xs font-bold hover:bg-[#b83232] transition-colors cursor-pointer"
              >
                Yes, Void Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
