import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import InvoiceModal from '../components/InvoiceModal';
import useCosmeticsSubcategories from '../hooks/useCosmeticsSubcategories';
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  CreditCard,
  Banknote,
  AlertCircle,
  Search,
  Package,
  Store,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

export default function POS() {
  const { user, isOwner } = useAuth();
  const { subcategories: cosmeticsSubcategories } = useCosmeticsSubcategories();
  const [selectedOutlet, setSelectedOutlet] = useState(
    user?.outlet && user.outlet !== 'All' ? user.outlet : 'Outlet 1'
  );
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState('ALL');
  const [isSubCategoryOpen, setIsSubCategoryOpen] = useState(false);
  const [subCategorySearch, setSubCategorySearch] = useState('');
  const subCategoryRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (subCategoryRef.current && !subCategoryRef.current.contains(e.target)) {
        setIsSubCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Payment State
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');

  // Checkout State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [invoiceData, setInvoiceData] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
      ]);
      if (prodRes.data.success) {
        setProducts(prodRes.data.products.filter(p => p.isActive && p.currentStock > 0));
      }
      if (catRes.data.success) {
        setCategories(catRes.data.categories || catRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load products / categories', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const isStationaryCategory = (cat) => {
    if (!cat) return false;
    const name = typeof cat === 'object' ? (cat.name || '') : String(cat);
    return /station/i.test(name);
  };

  const isProductStationary = (product) => {
    if (!product) return false;
    const catName = product.category?.name || categories.find(c => c._id === product.category)?.name || '';
    return /station/i.test(catName);
  };

  const handleOutletSwitch = (newOutlet) => {
    setSelectedOutlet(newOutlet);
    setSelectedSubCategory('ALL');
    if (newOutlet === 'Outlet 1') {
      // Find non-stationary items in cart
      const nonStationary = cart.filter(item => !isProductStationary(item.product));
      if (nonStationary.length > 0) {
        setCart(prev => prev.filter(item => isProductStationary(item.product)));
        setError(`Removed ${nonStationary.length} item(s) from cart. Outlet 1 is restricted to Stationary items only.`);
        setTimeout(() => setError(''), 4000);
      }
      // If selected category is non-stationary, reset to ALL
      if (selectedCategory !== 'ALL') {
        const currentCat = categories.find(c => c._id === selectedCategory);
        if (currentCat && !isStationaryCategory(currentCat)) {
          setSelectedCategory('ALL');
        }
      }
    } else {
      // Outlet 2
      const stationary = cart.filter(item => isProductStationary(item.product));
      if (stationary.length > 0) {
        setCart(prev => prev.filter(item => !isProductStationary(item.product)));
        setError(`Removed ${stationary.length} item(s) from cart. Outlet 2 does not sell Stationary items.`);
        setTimeout(() => setError(''), 4000);
      }
      // If selected category is stationary, reset to ALL
      if (selectedCategory !== 'ALL') {
        const currentCat = categories.find(c => c._id === selectedCategory);
        if (currentCat && isStationaryCategory(currentCat)) {
          setSelectedCategory('ALL');
        }
      }
    }
  };

  // Filtered product list
  const isOutlet1 = selectedOutlet === 'Outlet 1';
  const availableCategories = isOutlet1
    ? categories.filter(isStationaryCategory)
    : categories.filter(c => !isStationaryCategory(c));

  const selectedCatObj = categories.find(c => c._id === selectedCategory);
  const isCosmeticsSelected = selectedCatObj ? /cosmetic/i.test(selectedCatObj.name) : false;

  const visibleProducts = products.filter(p => {
    // If Outlet 1, product MUST be Stationary
    if (isOutlet1 && !isProductStationary(p)) {
      return false;
    }
    // If Outlet 2, product MUST NOT be Stationary
    if (!isOutlet1 && isProductStationary(p)) {
      return false;
    }

    const catMatch =
      selectedCategory === 'ALL' ||
      (p.category && (p.category._id === selectedCategory || p.category === selectedCategory));

    // If Cosmetics category is selected, narrow to chosen subcategory
    if (isCosmeticsSelected && selectedSubCategory !== 'ALL') {
      if (p.subCategory !== selectedSubCategory) {
        return false;
      }
    }

    const searchMatch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.trim().toLowerCase()));
    return catMatch && searchMatch;
  });

  const addToCart = (product) => {
    setError('');
    if (isOutlet1 && !isProductStationary(product)) {
      setError(`Cannot add "${product.name}". Outlet 1 only sells Stationary products.`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!isOutlet1 && isProductStationary(product)) {
      setError(`Cannot add "${product.name}". Outlet 2 does not sell Stationary products.`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (product.sellingPrice == null || product.sellingPrice <= 0) {
      setError(`Selling price not set for "${product.name}" — set price in Inventory before selling.`);
      setTimeout(() => setError(''), 4000);
      return;
    }
    if (product.currentStock <= 0) {
      setError(`${product.name} is out of stock!`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          setError(`Only ${product.currentStock} units in stock for "${product.name}".`);
          setTimeout(() => setError(''), 3000);
          return prev;
        }
        return prev.map(i =>
          i.product._id === product._id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * (i.product.sellingPrice || 0) }
            : i
        );
      }
      return [...prev, { product, quantity: 1, subtotal: product.sellingPrice || 0 }];
    });
  };

  const updateQuantity = (productId, newQtyOrDelta, isDirect = false) => {
    setError('');
    setCart(prev =>
      prev.map(item => {
        if (item.product._id !== productId) return item;
        let newQty = isDirect ? parseInt(newQtyOrDelta, 10) : item.quantity + newQtyOrDelta;
        if (isNaN(newQty) || newQty < 1) newQty = 1;
        if (newQty > item.product.currentStock) {
          setError(`Cannot exceed available stock (${item.product.currentStock} units).`);
          setTimeout(() => setError(''), 3000);
          newQty = item.product.currentStock;
        }
        return { ...item, quantity: newQty, subtotal: newQty * item.product.sellingPrice };
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(i => i.product._id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setAmountReceived('');
    setError('');
  };

  // Totals
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountVal = Math.min(Math.max(0, Number(discount) || 0), subtotal);
  const grandTotal = Math.max(0, subtotal - discountVal);
  const changeDue = Math.max(0, (Number(amountReceived) || 0) - grandTotal);
  const isCartEmpty = cart.length === 0;
  const isPaymentValid =
    paymentMethod !== 'cash' || (Number(amountReceived) >= grandTotal && grandTotal > 0);

  const handleCheckout = async () => {
    if (isCartEmpty) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        items: cart.map(i => ({ product: i.product._id, quantity: i.quantity })),
        paymentMethod,
        outlet: selectedOutlet,
        discountAmount: discountVal,
        taxAmount: 0,
        receivedAmount: paymentMethod === 'cash' ? Number(amountReceived) || grandTotal : grandTotal,
      };
      const res = await api.post('/sales', payload);
      if (res.data.success) {
        setInvoiceData(res.data.sale);
        setIsInvoiceModalOpen(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process sale.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseInvoice = () => {
    setIsInvoiceModalOpen(false);
    setInvoiceData(null);
    clearCart();
    setPaymentMethod('cash');
    fetchProducts();
  };

  return (
    <div className="space-y-4 animate-fade-in text-[#2B2926] pb-8">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E8E4DC] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#14324B] flex items-center justify-center text-white shadow-sm">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
          <h1 className="text-xl font-bold text-[#14324B] tracking-tight">
            Point of Sale (POS) {isOutlet1 && <span className="text-sm font-normal text-[#14324B]/70">&bull; Stationary Outlet</span>}
          </h1>
          <p className="text-xs text-[#2B2926]/60">Select items from catalog & process customer checkout</p>
        </div>
      </div>

      {/* Outlet Selector */}
      <div className="flex items-center gap-3 self-start sm:self-auto">
        {isOwner ? (
          <div className="flex items-center gap-1.5 bg-[#FAF9F6] p-1 rounded-lg border border-[#E8E4DC]">
            <span className="text-xs font-bold text-[#14324B] px-2">Active Outlet:</span>
            <button
              type="button"
              onClick={() => handleOutletSwitch('Outlet 1')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                selectedOutlet === 'Outlet 1'
                  ? 'bg-[#14324B] text-white shadow-xs'
                  : 'text-[#2B2926]/70 hover:text-[#14324B]'
              }`}
            >
              🏪 Stationary Outlet
            </button>
            <button
              type="button"
              onClick={() => handleOutletSwitch('Outlet 2')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                selectedOutlet === 'Outlet 2'
                  ? 'bg-[#14324B] text-white shadow-xs'
                  : 'text-[#2B2926]/70 hover:text-[#14324B]'
              }`}
            >
              🏪 Outlet 2
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-[#14324B]/10 text-[#14324B] px-3.5 py-1.5 rounded-lg border border-[#14324B]/20 font-bold text-xs">
            <Store className="w-4 h-4" />
            <span>Counter: {isOutlet1 ? 'Stationary Outlet' : selectedOutlet}</span>
          </div>
        )}
      </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-xs underline font-bold cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT COLUMN: Current Sale Cart & Checkout Panel (7 Cols) ─────── */}
        <div className="lg:col-span-7 flex flex-col gap-4">

          {/* Current Sale Header & Items List */}
          <div className="retail-card overflow-hidden bg-white border border-[#E8E4DC] shadow-sm flex flex-col">
            <div className="p-4 border-b border-[#E8E4DC] bg-[#FAF9F6] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#14324B]/10 text-[#14324B] flex items-center justify-center font-bold">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-[#14324B]">Current Sale Items</h2>
                  <p className="text-[11px] text-[#2B2926]/50">
                    {cart.length} distinct item{cart.length === 1 ? '' : 's'} ({totalUnits} pcs total)
                  </p>
                </div>
              </div>

              {!isCartEmpty && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-[#D64545] hover:bg-[#D64545]/10 px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Cart Items Area */}
            <div className="p-3 min-h-[260px] max-h-[420px] overflow-y-auto bg-[#FAF9F6]/40">
              {isCartEmpty ? (
                <div className="h-56 flex flex-col items-center justify-center text-[#2B2926]/40 gap-2 border-2 border-dashed border-[#E8E4DC] rounded-xl bg-white m-2">
                  <Package className="w-10 h-10 opacity-40 text-[#14324B]" />
                  <p className="text-xs font-bold text-[#14324B]">No materials selected yet</p>
                  <p className="text-[11px] text-[#2B2926]/50">Click any product from the catalog on the right to add to bill</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item, idx) => (
                    <div
                      key={item.product._id}
                      className="p-3 rounded-lg bg-white border border-[#E8E4DC] hover:border-[#14324B]/40 transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      {/* Item Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-md bg-[#14324B]/5 text-[#14324B] font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[#2B2926] text-xs truncate">
                            {item.product.name}
                          </div>
                          <div className="text-[11px] text-[#2B2926]/60 font-mono mt-0.5 flex items-center gap-2">
                            <span>₹{item.product.sellingPrice.toFixed(2)} / unit</span>
                            <span className="text-[10px] text-[#2B2926]/40">({item.product.currentStock} in stock)</span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center bg-[#FAF9F6] rounded-lg border border-[#E8E4DC] p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product._id, -1)}
                          className="w-7 h-7 flex items-center justify-center text-[#2B2926]/70 hover:text-[#14324B] hover:bg-white rounded transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.product.currentStock}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product._id, e.target.value, true)}
                          className="w-10 text-center font-bold text-xs text-[#14324B] font-mono bg-transparent border-0 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product._id, 1)}
                          className="w-7 h-7 flex items-center justify-center text-[#2B2926]/70 hover:text-[#14324B] hover:bg-white rounded transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Subtotal */}
                      <div className="w-24 text-right">
                        <div className="text-[10px] text-[#2B2926]/40 uppercase">Line Total</div>
                        <div className="font-bold font-mono text-sm text-[#14324B]">
                          ₹{item.subtotal.toFixed(2)}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product._id)}
                        className="p-1.5 text-[#D64545]/60 hover:text-[#D64545] hover:bg-[#D64545]/10 rounded-md transition-colors cursor-pointer flex-shrink-0"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payment & Checkout Summary Block */}
          <div className="receipt-card p-5 bg-white border border-[#E8E4DC] rounded-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E4DC]">
              <span className="font-bold text-xs text-[#14324B] uppercase tracking-wider">Payment & Settlement</span>
              <span className="text-xs font-mono font-semibold text-[#2B2926]/60">Outlet: {selectedOutlet}</span>
            </div>

            {/* Discount & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#2B2926]/70 uppercase block mb-1">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  disabled={isCartEmpty}
                  placeholder="0.00"
                  className="form-input py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#2B2926]/70 uppercase block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  disabled={isCartEmpty}
                  className="form-input py-2 text-xs font-semibold"
                >
                  <option value="cash">💵 Cash</option>
                  <option value="upi">📱 UPI / QR Scan</option>
                  <option value="card">💳 Card / POS Swipe</option>
                </select>
              </div>
            </div>

            {/* Bill Calculations */}
            <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E8E4DC] space-y-2 font-mono text-xs">
              <div className="flex justify-between text-[#2B2926]/70">
                <span>Items Subtotal ({totalUnits} pcs):</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discountVal > 0 && (
                <div className="flex justify-between text-[#D64545]">
                  <span>Discount Applied:</span>
                  <span>- ₹{discountVal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#14324B] pt-2 border-t border-[#E8E4DC]">
                <span>Net Payable:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Cash Tendered & Change (When paymentMethod is cash) */}
            {paymentMethod === 'cash' && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-[#2F9E44]/5 border border-[#2F9E44]/30 items-center">
                <div>
                  <label className="text-[11px] font-bold text-[#2F9E44] uppercase block mb-1">
                    Cash Received (₹)
                  </label>
                  <input
                    type="number"
                    min={grandTotal}
                    value={amountReceived}
                    onChange={e => setAmountReceived(e.target.value)}
                    disabled={isCartEmpty}
                    placeholder={grandTotal.toFixed(2)}
                    className="form-input py-1.5 text-sm font-mono font-bold text-[#14324B] bg-white"
                  />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#2B2926]/60 uppercase block">Change to Return</span>
                  <span className="text-xl font-bold font-mono text-[#2F9E44]">
                    ₹{changeDue.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Complete Sale Button */}
            <button
              onClick={handleCheckout}
              disabled={isCartEmpty || submitting || (!isPaymentValid && paymentMethod === 'cash')}
              className={`w-full py-3.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                isCartEmpty || (!isPaymentValid && paymentMethod === 'cash')
                  ? 'bg-[#E8E4DC] text-[#2B2926]/40 cursor-not-allowed shadow-none'
                  : 'bg-[#E8A33D] hover:bg-[#E8A33D]/90 text-white'
              }`}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Generating Invoice...</span>
                </span>
              ) : (
                <>
                  {paymentMethod === 'cash' ? <Banknote className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                  <span>Complete Sale &bull; ₹{grandTotal.toFixed(2)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>

        {/* ── RIGHT COLUMN: Product Picker & Catalog Grid (5 Cols) ───────────── */}
        <div className="lg:col-span-5 flex flex-col gap-4">

          {/* Search Bar */}
          <div className="retail-card p-3 bg-white border border-[#E8E4DC]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#2B2926]/40 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search catalog by name or brand..."
                className="form-input pl-9 py-1.5 text-xs w-full"
              />
            </div>
          </div>

          {/* Category Quick Filter — only shown for Outlet 2 (multiple categories) */}
          {!isOutlet1 && (
            <div className="retail-card p-2.5 bg-white border border-[#E8E4DC]">
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSelectedSubCategory('ALL');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === 'ALL'
                      ? 'bg-[#14324B] text-white shadow-xs'
                      : 'bg-[#FAF9F6] text-[#2B2926]/70 border border-[#E8E4DC] hover:border-[#14324B]'
                  }`}
                >
                  All
                </button>
                {availableCategories.map(cat => (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat._id);
                      setSelectedSubCategory('ALL');
                      setIsSubCategoryOpen(false);
                      setSubCategorySearch('');
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === cat._id
                        ? 'bg-[#14324B] text-white shadow-xs'
                        : 'bg-[#FAF9F6] text-[#2B2926]/70 border border-[#E8E4DC] hover:border-[#14324B]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Custom Styled Subcategory Dropdown — matching website aesthetics */}
              {isCosmeticsSelected && (
                <div className="pt-2.5 mt-2.5 border-t border-[#E8E4DC] flex items-center gap-2.5 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#14324B] shrink-0 bg-[#FAF9F6] px-2.5 py-1.5 rounded-md border border-[#E8E4DC]">
                    <Sparkles className="w-3.5 h-3.5 text-[#E8A33D]" />
                    <span>Subcategory:</span>
                  </div>

                  <div className="relative flex-1" ref={subCategoryRef}>
                    <button
                      type="button"
                      onClick={() => setIsSubCategoryOpen(!isSubCategoryOpen)}
                      className="w-full bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#14324B] border border-[#E8E4DC] hover:border-[#14324B]/40 focus:border-[#14324B] rounded-md py-1.5 px-3 shadow-2xs transition-all flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">
                        {selectedSubCategory === 'ALL'
                          ? `All Cosmetics (${cosmeticsSubcategories.length})`
                          : selectedSubCategory}
                      </span>
                      <ChevronUp
                        className={`w-4 h-4 text-[#14324B]/60 transition-transform duration-200 shrink-0 ml-2 ${
                          isSubCategoryOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isSubCategoryOpen && (
                      <div className="absolute left-0 bottom-full mb-1.5 w-full bg-white rounded-lg shadow-2xl border border-[#E8E4DC] z-50 overflow-hidden animate-fade-in">
                        {/* Search inside subcategory options */}
                        <div className="p-2 border-b border-[#E8E4DC] bg-[#FAF9F6]">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-[#2B2926]/40 absolute left-2.5 top-2.5" />
                            <input
                              type="text"
                              autoFocus
                              value={subCategorySearch}
                              onChange={e => setSubCategorySearch(e.target.value)}
                              placeholder="Search subcategory..."
                              className="w-full bg-white border border-[#E8E4DC] rounded text-xs pl-8 pr-2.5 py-1.5 outline-none focus:border-[#14324B] text-[#14324B] placeholder-[#2B2926]/40"
                            />
                          </div>
                        </div>

                        <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                          {/* All Cosmetics option */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSubCategory('ALL');
                              setIsSubCategoryOpen(false);
                              setSubCategorySearch('');
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                              selectedSubCategory === 'ALL'
                                ? 'bg-[#14324B] text-white'
                                : 'text-[#2B2926] hover:bg-[#FAF9F6]'
                            }`}
                          >
                            <span>All Cosmetics ({cosmeticsSubcategories.length})</span>
                            {selectedSubCategory === 'ALL' && <Check className="w-3.5 h-3.5" />}
                          </button>

                          {/* Filtered Subcategories list */}
                          {cosmeticsSubcategories
                            .filter(sub => sub.toLowerCase().includes(subCategorySearch.toLowerCase()))
                            .map(sub => (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => {
                                  setSelectedSubCategory(sub);
                                  setIsSubCategoryOpen(false);
                                  setSubCategorySearch('');
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                  selectedSubCategory === sub
                                    ? 'bg-[#14324B] text-white font-bold'
                                    : 'text-[#2B2926] hover:bg-[#FAF9F6]'
                                }`}
                              >
                                <span>{sub}</span>
                                {selectedSubCategory === sub && <Check className="w-3.5 h-3.5" />}
                              </button>
                            ))}

                          {cosmeticsSubcategories.filter(sub => sub.toLowerCase().includes(subCategorySearch.toLowerCase())).length === 0 && (
                            <div className="py-3 text-center text-xs text-[#2B2926]/40">
                              No matching subcategory
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Products Grid */}
          <div className="retail-card overflow-hidden bg-white border border-[#E8E4DC] flex-1 flex flex-col min-h-[400px]">
            <div className="p-3 border-b border-[#E8E4DC] bg-[#FAF9F6] flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs text-[#14324B]">
                  {selectedCategory === 'ALL'
                    ? 'All Products'
                    : availableCategories.find(c => c._id === selectedCategory)?.name || 'Products'}
                </span>
                {isCosmeticsSelected && selectedSubCategory !== 'ALL' && (
                  <>
                    <span className="text-xs text-[#2B2926]/40">›</span>
                    <span className="text-xs font-bold text-[#14324B] bg-white px-2 py-0.5 rounded border border-[#E8E4DC] shadow-2xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#E8A33D]" />
                      {selectedSubCategory}
                    </span>
                  </>
                )}
              </div>
              <span className="text-[11px] font-mono text-[#2B2926]/50">{visibleProducts.length} items available</span>
            </div>

            <div className="p-3 overflow-y-auto flex-1 max-h-[550px] bg-[#FAF9F6]/20">
              {loadingProducts ? (
                <div className="text-center py-12 text-xs text-[#2B2926]/50">Loading products catalog...</div>
              ) : visibleProducts.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#2B2926]/50">No products found matching your search.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {visibleProducts.map(product => {
                    const cartItem = cart.find(i => i.product._id === product._id);
                    const isInCart = Boolean(cartItem);

                    return (
                      <button
                        key={product._id}
                        type="button"
                        onClick={() => addToCart(product)}
                        className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between cursor-pointer relative group ${
                          isInCart
                            ? 'bg-[#2F9E44]/5 border-[#2F9E44] shadow-xs'
                            : 'bg-white border-[#E8E4DC] hover:border-[#14324B] hover:shadow-sm'
                        }`}
                      >
                        {isInCart && (
                          <span className="absolute top-2 right-2 bg-[#2F9E44] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" />
                            <span>{cartItem.quantity} in cart</span>
                          </span>
                        )}

                        <div className="pr-12">
                          <div className="font-bold text-[#2B2926] text-xs leading-snug group-hover:text-[#14324B]">
                            {product.name}
                          </div>
                          <div className="text-[10px] text-[#2B2926]/50 mt-0.5">
                            {product.brand || product.category?.name || 'Item'}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#E8E4DC]/60">
                          <span className="font-bold font-mono text-sm text-[#14324B]">
                            {product.sellingPrice != null ? (
                              `₹${Number(product.sellingPrice).toFixed(2)}`
                            ) : (
                              <span className="text-[#D98E04] bg-[#D98E04]/10 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                Unpriced
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-[#2B2926]/60 font-mono">
                            Stock: <strong>{product.currentStock}</strong>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={handleCloseInvoice}
        invoiceData={invoiceData}
      />
    </div>
  );
}
