import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PurchaseDetailModal from '../components/PurchaseDetailModal';
import {
  Truck,
  Plus,
  X,
  Search,
  RefreshCw,
  Eye,
  PackagePlus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [outletFilter, setOutletFilter] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const params = {};
      if (outletFilter && outletFilter !== 'All') params.outlet = outletFilter;
      const res = await api.get('/purchases', { params });
      if (res.data.success) setPurchases(res.data.purchases || []);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [outletFilter]);

  const filteredPurchases = purchases.filter((po) =>
    searchQuery.trim() === '' ||
    po.purchaseOrderNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRestockValue = purchases.reduce((sum, po) => sum + (Number(po.totalAmount) || 0), 0);

  const handleViewPO = (po) => {
    setSelectedPO(po);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#2B2926]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14324B] tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6" /> Purchases & Restock
          </h1>
          <p className="text-[#2B2926]/60 text-sm mt-1">
            Record inventory restocks and track stock intake history across outlets.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary text-xs py-2 px-4 flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Restock Batch
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="retail-card p-4 flex items-center gap-4 bg-white">
          <div className="w-12 h-12 rounded-lg bg-[#14324B]/10 flex items-center justify-center text-[#14324B]">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#2B2926]/60 font-medium">Total Restock Orders</div>
            <div className="text-2xl font-bold text-[#14324B] mt-0.5">{purchases.length}</div>
          </div>
        </div>

        <div className="retail-card p-4 flex items-center gap-4 bg-white">
          <div className="w-12 h-12 rounded-lg bg-[#2F9E44]/10 flex items-center justify-center text-[#2F9E44]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#2B2926]/60 font-medium">Total Restock Value</div>
            <div className="text-2xl font-bold text-[#14324B] font-mono mt-0.5">
              ₹{totalRestockValue.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="retail-card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white">
        <div className="flex-1 w-full relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PO Number..."
            className="form-input pl-10 text-sm"
          />
          <Search className="w-4 h-4 text-[#2B2926]/40 absolute left-3.5 top-3.5" />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={outletFilter}
            onChange={e => setOutletFilter(e.target.value)}
            className="form-input text-xs w-44 font-semibold"
          >
            <option value="All">All Outlets</option>
            <option value="Outlet 1">Stationary Outlet</option>
            <option value="Outlet 2">Outlet 2</option>
          </select>
          <button
            onClick={fetchPurchases}
            className="btn-secondary p-2.5 cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* PO History Table */}
      <div className="retail-card overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>PO Number</th>
                <th>Outlet</th>
                <th>Materials / Items</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-[#2B2926]/50">
                    Loading restock orders...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-[#2B2926]/50">
                    No restock purchase orders found. Click "New Restock Batch" to restock items.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((po) => {
                  const dateObj = new Date(po.createdAt);
                  const totalUnits = po.items?.reduce((s, i) => s + (Number(i.quantity) || 0), 0) || 0;
                  return (
                    <tr key={po._id}>
                      <td>
                        <div className="font-semibold text-sm">
                          {dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-[#2B2926]/50">
                          {dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-xs font-bold text-[#14324B] bg-[#FAF9F6] px-2.5 py-1 rounded border border-[#E8E4DC]">
                          {po.purchaseOrderNumber}
                        </span>
                      </td>
                      <td>
                        <span className="badge-role bg-[#14324B]/10 text-[#14324B] font-semibold text-xs">
                          🏪 {po.outlet === 'Outlet 1' ? 'Stationary Outlet' : (po.outlet || 'Stationary Outlet')}
                        </span>
                      </td>
                      <td className="text-sm">
                        <span className="font-medium text-[#14324B]">{po.items?.length || 0} items</span>
                        <span className="text-xs text-[#2B2926]/50 ml-1.5 font-mono">({totalUnits} units)</span>
                      </td>
                      <td className="font-bold font-mono text-[#14324B]">
                        ₹{Number(po.totalAmount || 0).toFixed(2)}
                      </td>
                      <td>
                        <span className="badge-role uppercase text-[10px] font-bold">
                          {po.status || 'RECEIVED'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleViewPO(po)}
                          className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Restock Modal */}
      {isFormOpen && (
        <PurchaseFormModal
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            fetchPurchases();
            setIsFormOpen(false);
          }}
        />
      )}

      {/* View PO Details Modal */}
      <PurchaseDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        purchase={selectedPO}
      />
    </div>
  );
}

/**
 * Interactive Purchase / Restock Batch Form Modal
 */
function PurchaseFormModal({ onClose, onSuccess }) {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState('Outlet 1');
  const [loadingProds, setLoadingProds] = useState(true);

  // Selected items to restock: [{ product, productName, quantity, unitCostPrice, currentStock }]
  const [restockItems, setRestockItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoadingProds(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories')
        ]);
        if (prodRes.data.success) {
          setAllProducts(prodRes.data.products || []);
        }
        if (catRes.data.success) {
          setCategories(catRes.data.categories || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProds(false);
      }
    };
    fetchCatalog();
  }, []);

  const handleAddProduct = (prod) => {
    setError('');
    const existingIndex = restockItems.findIndex((item) => item.product === prod._id);
    if (existingIndex > -1) {
      // Increase quantity by 1
      const updated = [...restockItems];
      updated[existingIndex].quantity += 1;
      setRestockItems(updated);
    } else {
      setRestockItems([
        ...restockItems,
        {
          product: prod._id,
          productName: prod.name,
          currentStock: prod.currentStock,
          quantity: 1,
          unitCostPrice: Number(prod.costPrice) || 0
        }
      ]);
    }
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...restockItems];
    updated[index][field] = value;
    setRestockItems(updated);
  };

  const handleRemoveItem = (index) => {
    setRestockItems(restockItems.filter((_, i) => i !== index));
  };

  const totalCost = restockItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitCostPrice) || 0),
    0
  );

  const totalQuantity = restockItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  const isOutlet1 = selectedOutlet === 'Outlet 1';

  const handleOutletChange = (newOutlet) => {
    setSelectedOutlet(newOutlet);
    if (newOutlet === 'Outlet 1') {
      // Remove any non-stationary items
      const validStationary = restockItems.filter(item => {
        const prod = allProducts.find(p => p._id === item.product);
        return /station/i.test(prod?.category?.name || '');
      });
      if (validStationary.length < restockItems.length) {
        setError(`Filtered out non-Stationary items. Stationary Outlet is restricted to Stationary products.`);
      }
      setRestockItems(validStationary);
      setSelectedCat('ALL');
    }
  };

  const visibleCategories = isOutlet1
    ? categories.filter(c => /station/i.test(c.name))
    : categories;

  const filteredCatalog = allProducts.filter((p) => {
    if (isOutlet1 && !/station/i.test(p.category?.name || '')) {
      return false;
    }
    const catMatch =
      selectedCat === 'ALL' ||
      (p.category && (p.category._id === selectedCat || p.category === selectedCat));
    const searchMatch =
      !searchTerm.trim() ||
      p.name?.toLowerCase().includes(searchTerm.trim().toLowerCase());
    return catMatch && searchMatch;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (restockItems.length === 0) {
      setError('Please add at least one material/product to restock.');
      return;
    }

    // Validate quantities & cost prices
    for (const item of restockItems) {
      if (!item.quantity || Number(item.quantity) < 1) {
        setError(`Please enter a valid quantity for "${item.productName}".`);
        return;
      }
      if (item.unitCostPrice === '' || Number(item.unitCostPrice) < 0) {
        setError(`Please enter a valid cost price for "${item.productName}".`);
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        outlet: selectedOutlet,
        items: restockItems.map((item) => ({
          product: item.product,
          quantity: parseInt(item.quantity, 10),
          unitCostPrice: parseFloat(item.unitCostPrice)
        })),
        paidAmount: totalCost
      };

      const res = await api.post('/purchases', payload);
      if (res.data.success) {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit restock order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2B2926]/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="retail-card max-w-4xl w-full bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#FAF9F6] border-b border-[#E8E4DC] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#14324B]/10 flex items-center justify-center text-[#14324B]">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#14324B]">New Restock Batch</h2>
              <p className="text-xs text-[#2B2926]/60 mt-0.5">
                Select items from catalog to increase stock & update unit cost
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-[#E8E4DC]">
              <span className="text-xs font-bold text-[#14324B]">Outlet:</span>
              <select
                value={selectedOutlet}
                onChange={e => handleOutletChange(e.target.value)}
                className="text-xs font-semibold bg-transparent border-0 focus:outline-none cursor-pointer"
              >
                <option value="Outlet 1">Stationary Outlet</option>
                <option value="Outlet 2">Outlet 2</option>
              </select>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#2B2926]/40 hover:text-[#D64545] hover:bg-[#D64545]/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="m-4 mb-0 p-3 rounded bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* 2-Column Split: Catalog Picker vs Restock Batch Table */}
        <div className="p-4 flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left Column: Product Selector (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-2.5 overflow-hidden border border-[#E8E4DC] rounded-lg p-3 bg-[#FAF9F6]/40">
            <div className="font-bold text-xs text-[#14324B]">Select Materials to Restock</div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#2B2926]/40 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search material name..."
                className="form-input pl-8 py-1.5 text-xs w-full bg-white"
              />
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
              <button
                type="button"
                onClick={() => setSelectedCat('ALL')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  selectedCat === 'ALL'
                    ? 'bg-[#14324B] text-white'
                    : 'bg-white text-[#2B2926]/70 border border-[#E8E4DC]'
                }`}
              >
                All
              </button>
              {visibleCategories.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => setSelectedCat(c._id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    selectedCat === c._id
                      ? 'bg-[#14324B] text-white'
                      : 'bg-white text-[#2B2926]/70 border border-[#E8E4DC]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Product list */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[220px]">
              {loadingProds ? (
                <div className="text-center py-8 text-xs text-[#2B2926]/40">Loading catalog...</div>
              ) : filteredCatalog.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#2B2926]/40">No materials match</div>
              ) : (
                filteredCatalog.map((prod) => {
                  const isAdded = restockItems.some((i) => i.product === prod._id);
                  return (
                    <button
                      key={prod._id}
                      type="button"
                      onClick={() => handleAddProduct(prod)}
                      className={`w-full text-left p-2 rounded border transition-all flex items-center justify-between text-xs cursor-pointer ${
                        isAdded
                          ? 'bg-[#2F9E44]/10 border-[#2F9E44]/40 text-[#14324B]'
                          : 'bg-white border-[#E8E4DC] hover:border-[#14324B] text-[#2B2926]'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="font-semibold truncate">{prod.name}</div>
                        <div className="text-[10px] text-[#2B2926]/50 mt-0.5">
                          Cost: ₹{prod.costPrice} &bull; Stock: {prod.currentStock}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#14324B] bg-[#FAF9F6] px-1.5 py-0.5 rounded border border-[#E8E4DC] shrink-0">
                        {isAdded ? 'Add +' : '+ Add'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Restock Batch Line Items (7 cols) */}
          <div className="md:col-span-7 flex flex-col overflow-hidden border border-[#E8E4DC] rounded-lg p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-xs text-[#14324B]">
                Restock Batch ({restockItems.length} items &bull; {totalQuantity} units)
              </div>
              {restockItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRestockItems([])}
                  className="text-[11px] text-[#D64545] hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Line items list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {restockItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[#2B2926]/40 py-12 gap-2">
                  <PackagePlus className="w-8 h-8 opacity-40" />
                  <p className="text-xs">Click materials from the left list to add to restock batch</p>
                </div>
              ) : (
                restockItems.map((item, index) => {
                  const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitCostPrice) || 0);
                  const newStockPreview = Number(item.currentStock || 0) + (Number(item.quantity) || 0);

                  return (
                    <div
                      key={item.product}
                      className="p-2.5 rounded-lg border border-[#E8E4DC] bg-[#FAF9F6] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-[#14324B] truncate flex-1 pr-2">
                          {item.productName}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-[#D64545]/70 hover:text-[#D64545] p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 items-center">
                        <div>
                          <label className="text-[10px] text-[#2B2926]/60 block mb-0.5">
                            Qty to Add (+)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                            className="form-input py-1 px-2 text-xs font-mono font-bold w-full bg-white text-[#2F9E44]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-[#2B2926]/60 block mb-0.5">
                            Unit Cost (₹)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitCostPrice}
                            onChange={(e) => handleUpdateItem(index, 'unitCostPrice', e.target.value)}
                            className="form-input py-1 px-2 text-xs font-mono w-full bg-white text-[#14324B]"
                          />
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-[#2B2926]/60 block">Line Total</span>
                          <span className="font-bold font-mono text-sm text-[#14324B]">
                            ₹{lineTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-[#2B2926]/60 pt-1 border-t border-[#E8E4DC]/60 flex justify-between">
                        <span>Current Stock: <strong>{item.currentStock}</strong></span>
                        <span>New Stock Level: <strong className="text-[#2F9E44]">{newStockPreview}</strong></span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Total summary footer inside right column */}
            {restockItems.length > 0 && (
              <div className="pt-3 mt-2 border-t border-[#E8E4DC] flex justify-between items-center bg-white">
                <div>
                  <div className="text-[10px] text-[#2B2926]/50 uppercase font-semibold">Total Investment</div>
                  <div className="text-lg font-bold font-mono text-[#14324B]">
                    ₹{totalCost.toFixed(2)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting ? 'Updating Stock...' : 'Confirm Restock'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#FAF9F6] border-t border-[#E8E4DC] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs px-4 py-1.5 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
