import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Plus, Edit2, Wallet, X, Save } from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      if (res.data.success) setSuppliers(res.data.suppliers);
    } catch (err) {
      setError('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  return (
    <div className="space-y-6 animate-fade-in text-[#2B2926]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14324B] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6" /> Supplier Directory
          </h1>
          <p className="text-[#2B2926]/60 text-sm mt-1">Manage vendors and track unpaid balances.</p>
        </div>
        <button onClick={() => { setEditingSupplier(null); setIsFormOpen(true); }} className="btn-primary text-xs py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      {error && <div className="p-4 rounded-md bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] text-sm">{error}</div>}

      <div className="retail-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Ledger Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-[#2B2926]/50">Loading...</td></tr>
              ) : suppliers.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-[#2B2926]/50">No suppliers found. Add your first supplier.</td></tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s._id}>
                    <td className="font-bold text-[#2B2926]">{s.name}</td>
                    <td className="text-[#2B2926]/70">{s.contactPerson || '-'}</td>
                    <td className="font-mono text-sm text-[#2B2926]/70">{s.phone || '-'}</td>
                    <td className="text-sm text-[#2B2926]/70">{s.email || '-'}</td>
                    <td>
                      <span className={`font-bold font-mono text-lg ${s.currentBalance > 0 ? 'text-[#D64545]' : 'text-[#2F9E44]'}`}>
                        ₹{s.currentBalance.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setPayingSupplier(s); setIsPaymentOpen(true); }}
                          disabled={s.currentBalance <= 0}
                          title="Record Payment"
                          className={`p-1.5 rounded border transition-colors ${s.currentBalance > 0 ? 'bg-[#2F9E44]/10 border-[#2F9E44]/30 text-[#2F9E44] hover:bg-[#2F9E44]/20' : 'opacity-30 cursor-not-allowed bg-[#FAF9F6] border-[#E8E4DC] text-[#2B2926]/40'}`}
                        >
                          <Wallet className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditingSupplier(s); setIsFormOpen(true); }} title="Edit" className="p-1.5 rounded border bg-[#FAF9F6] border-[#E8E4DC] text-[#14324B] hover:bg-[#14324B]/5 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && <SupplierFormModal supplier={editingSupplier} onClose={() => setIsFormOpen(false)} onSuccess={fetchSuppliers} />}
      {isPaymentOpen && <PaymentModal supplier={payingSupplier} onClose={() => setIsPaymentOpen(false)} onSuccess={fetchSuppliers} />}
    </div>
  );
}

function SupplierFormModal({ supplier, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contactPerson: supplier?.contactPerson || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (supplier) {
        await api.put(`/suppliers/${supplier._id}`, formData);
      } else {
        await api.post('/suppliers', formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2B2926]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="retail-card max-w-md w-full p-6 animate-fade-in text-[#2B2926]">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E4DC] mb-4">
          <h2 className="text-lg font-bold text-[#14324B]">{supplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
          <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
        </div>
        {error && <div className="mb-4 text-[#D64545] text-sm bg-[#D64545]/10 p-3 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Company Name *</label>
            <input type="text" required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="form-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Contact Person</label>
              <input type="text" value={formData.contactPerson} onChange={e=>setFormData({...formData, contactPerson: e.target.value})} className="form-input" />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input type="text" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">Email</label>
            <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="form-input" />
          </div>
          <div>
            <label className="form-label">Address</label>
            <input type="text" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="form-input" />
          </div>
          <button type="submit" disabled={submitting} className="w-full btn-primary mt-2">
            {submitting ? 'Saving...' : 'Save Supplier'}
          </button>
        </form>
      </div>
    </div>
  );
}

function PaymentModal({ supplier, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/suppliers/${supplier._id}/pay`, { amount: Number(amount), paymentMethod: method, referenceNumber: reference });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2B2926]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="retail-card max-w-sm w-full p-6 animate-fade-in text-[#2B2926]">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E4DC] mb-4">
          <h2 className="text-lg font-bold text-[#14324B]">Record Payment</h2>
          <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
        </div>
        <div className="mb-5 bg-[#FAF9F6] p-4 rounded border border-[#E8E4DC]">
          <div className="text-xs font-semibold text-[#2B2926]/60 uppercase mb-1">Paying to</div>
          <div className="font-bold text-[#2B2926]">{supplier.name}</div>
          <div className="text-xs text-[#2B2926]/60 mt-2 uppercase font-semibold">Current Debt</div>
          <div className="font-bold text-[#D64545] text-2xl font-mono">₹{supplier.currentBalance.toFixed(2)}</div>
        </div>
        {error && <div className="mb-4 text-[#D64545] text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Amount (₹) *</label>
            <input type="number" step="0.01" max={supplier.currentBalance} required value={amount} onChange={e=>setAmount(e.target.value)} className="form-input font-mono text-lg font-bold" />
          </div>
          <div>
            <label className="form-label">Method</label>
            <select value={method} onChange={e=>setMethod(e.target.value)} className="form-input">
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>
          <div>
            <label className="form-label">Reference (Txn ID / Cheque No.)</label>
            <input type="text" value={reference} onChange={e=>setReference(e.target.value)} className="form-input" />
          </div>
          <button type="submit" disabled={submitting} className="w-full btn-primary flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Confirm Payment
          </button>
        </form>
      </div>
    </div>
  );
}
