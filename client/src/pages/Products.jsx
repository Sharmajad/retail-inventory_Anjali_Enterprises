import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProductModal from '../components/ProductModal';
import CategoryModal from '../components/CategoryModal';
import StockAdjustModal from '../components/StockAdjustModal';
import { 
  Package, Plus, Search, Filter, AlertTriangle, 
  Tags, Edit2, Archive, Trash2, X, AlertCircle
} from 'lucide-react';

export default function Products() {
  const { user, isOwner } = useAuth();
  const isStationaryStaff = user?.role === 'staff' && user?.outlet === 'Outlet 1';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState(null);

  // Delete Confirmation Modal
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { search, category: categoryFilter, lowStock: lowStockOnly };
      if (isStationaryStaff) params.outlet = 'Outlet 1';
      const [prodRes, catRes] = await Promise.all([
        api.get('/products', { params }),
        api.get('/categories', { params: isStationaryStaff ? { outlet: 'Outlet 1' } : {} })
      ]);
      setProducts(prodRes.data.products);
      setCategories(catRes.data.categories);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, categoryFilter, lowStockOnly]);

  const handleEdit = (p) => {
    setEditingProduct(p);
    setIsProductModalOpen(true);
  };

  const handleAdjustStock = (p) => {
    setAdjustingProduct(p);
    setIsStockModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/products/${deletingProduct._id}`);
      setDeletingProduct(null);
      fetchData();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete product.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#2B2926]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14324B] tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6" /> Product Catalog & Inventory {isStationaryStaff && <span className="text-sm font-semibold text-[#14324B]/70">&bull; Stationary Outlet</span>}
          </h1>
          <p className="text-[#2B2926]/60 text-sm mt-1">
            {isStationaryStaff ? 'Manage Stationary items, pricing, and stock levels.' : 'Manage catalog items, pricing, restock levels, and delete inactive items.'}
          </p>
        </div>
        
        {isOwner && (
          <div className="flex gap-3">
            <button onClick={() => setIsCategoryModalOpen(true)} className="btn-secondary text-xs flex items-center gap-2 cursor-pointer">
              <Tags className="w-4 h-4" /> Categories
            </button>
            <button onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }} className="btn-primary text-xs flex items-center gap-2 py-2 cursor-pointer">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        )}
      </div>

      <div className="retail-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
        <div className="flex-1 w-full relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, brand, or barcode..."
            className="form-input pl-10"
          />
          <Search className="w-4 h-4 text-[#2B2926]/40 absolute left-3.5 top-3.5" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {!isStationaryStaff ? (
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="form-input w-40 text-xs">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          ) : (
            <div className="px-3 py-2 rounded bg-[#14324B]/10 border border-[#14324B]/20 text-[#14324B] text-xs font-bold">
              ✏️ Stationary Only
            </div>
          )}
          <button 
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-4 py-2.5 rounded border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              lowStockOnly ? 'bg-[#D98E04]/10 border-[#D98E04]/30 text-[#D98E04]' : 'bg-[#FAF9F6] border-[#E8E4DC] text-[#2B2926]/60'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Low Stock
          </button>
        </div>
      </div>

      <div className="retail-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                {isOwner && <th>Cost</th>}
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-[#2B2926]/50">Loading catalog...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-[#2B2926]/50">No products found.</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="font-bold text-[#2B2926]">{p.name}</div>
                      <div className="text-xs text-[#2B2926]/50">{p.brand || 'No Brand'}</div>
                    </td>
                    <td className="text-[#2B2926]/70 text-sm">{p.category?.name || '-'}</td>
                    {isOwner && <td className="font-mono text-[#2B2926]/50">₹{p.costPrice.toFixed(2)}</td>}
                    <td className="font-mono font-bold text-[#14324B]">₹{p.sellingPrice.toFixed(2)}</td>
                    <td className="font-mono font-bold">{p.currentStock}</td>
                    <td>
                      {!p.isActive ? (
                        <span className="status-badge bg-[#2B2926]/10 text-[#2B2926]/60">Inactive</span>
                      ) : p.currentStock <= 0 ? (
                        <span className="status-badge status-out-of-stock">Out of Stock</span>
                      ) : p.currentStock <= p.lowStockThreshold ? (
                        <span className="status-badge status-low-stock">Low Stock</span>
                      ) : (
                        <span className="status-badge status-in-stock">In Stock</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleAdjustStock(p)} className="btn-icon" title="Adjust Stock">
                          <Archive className="w-4 h-4"/>
                        </button>
                        {isOwner && (
                          <>
                            <button onClick={() => handleEdit(p)} className="btn-icon text-[#14324B]" title="Edit Product">
                              <Edit2 className="w-4 h-4"/>
                            </button>
                            <button onClick={() => { setDeleteError(''); setDeletingProduct(p); }} className="btn-icon text-[#D64545] hover:bg-[#D64545]/10" title="Delete Product">
                              <Trash2 className="w-4 h-4"/>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-[#2B2926]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="retail-card max-w-md w-full p-6 animate-fade-in text-[#2B2926] bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E4DC] mb-4">
              <div className="flex items-center gap-2 text-[#D64545]">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-bold text-base">Confirm Delete Product</h3>
              </div>
              <button onClick={() => setDeletingProduct(null)} className="btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 rounded bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <p className="text-sm text-[#2B2926]/80 mb-2">
              Are you sure you want to delete <strong className="text-[#14324B]">{deletingProduct.name}</strong>?
            </p>
            <p className="text-xs text-[#2B2926]/60 mb-6 bg-[#FAF9F6] p-3 rounded border border-[#E8E4DC]">
              ℹ️ This product will be deactivated and removed from the active catalog and POS checkout. Historic sales and purchase records will remain intact.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={isDeleting}
                className="btn-secondary text-xs py-2 px-4 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-[#D64545] hover:bg-[#D64545]/90 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {isDeleting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isProductModalOpen && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => setIsProductModalOpen(false)}
          onSuccess={fetchData}
          onDeleteRequest={(prod) => {
            setIsProductModalOpen(false);
            setDeletingProduct(prod);
          }}
        />
      )}
      {isCategoryModalOpen && <CategoryModal onClose={() => setIsCategoryModalOpen(false)} />}
      {isStockModalOpen && <StockAdjustModal product={adjustingProduct} onClose={() => setIsStockModalOpen(false)} onSuccess={fetchData} />}
    </div>
  );
}
