import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { X, Plus, Tags } from 'lucide-react';

export default function CategoryModal({ onClose }) {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    const res = await api.get('/categories');
    if (res.data.success) setCategories(res.data.categories);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/categories', { name, description });
      setName('');
      setDescription('');
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add category.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-[#2B2926]/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="retail-card max-w-md w-full p-0 animate-fade-in text-[#2B2926] shadow-2xl overflow-hidden">
        <div className="px-5 py-4 bg-[#FAF9F6] border-b border-[#E8E4DC] relative flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#14324B]/10 flex items-center justify-center text-[#14324B]">
              <Tags className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-[#14324B]">Manage Categories</h2>
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

        <div className="mb-5 max-h-48 overflow-y-auto space-y-2">
          {categories.length === 0 ? (
            <p className="text-sm text-[#2B2926]/50 text-center py-4">No categories yet.</p>
          ) : (
            categories.map(c => (
              <div key={c._id} className="flex items-center justify-between px-3 py-2 bg-[#FAF9F6] rounded border border-[#E8E4DC]">
                <span className="font-semibold text-sm text-[#2B2926]">{c.name}</span>
                <span className="text-xs text-[#2B2926]/50">{c.description || ''}</span>
              </div>
            ))
          )}
        </div>

        {error && <div className="mb-3 text-[#D64545] text-sm">{error}</div>}
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="form-label">New Category Name *</label>
            <input type="text" required value={name} onChange={e=>setName(e.target.value)} className="form-input" placeholder="e.g. Hair Care" />
          </div>
          <div>
            <label className="form-label">Description</label>
            <input type="text" value={description} onChange={e=>setDescription(e.target.value)} className="form-input" placeholder="Optional description" />
          </div>
          <button type="submit" disabled={submitting} className="w-full btn-primary flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
