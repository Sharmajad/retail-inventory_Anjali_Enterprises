import React, { useState, useEffect } from 'react';
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

  return (
    <div className="fixed inset-0 bg-[#2B2926]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="retail-card max-w-md w-full p-6 animate-fade-in text-[#2B2926]">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E4DC] mb-4">
          <h2 className="text-lg font-bold text-[#14324B] flex items-center gap-2">
            <Tags className="w-5 h-5" /> Manage Categories
          </h2>
          <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
        </div>

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
  );
}
