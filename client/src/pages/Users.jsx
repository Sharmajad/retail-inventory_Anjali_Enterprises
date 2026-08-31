import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UserCircle2, UserPlus, Shield, X, Save, KeyRound, Edit2 } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data.success) setUsers(res.data.users);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/users/${userId}/status`, { isActive: !currentStatus });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#2B2926]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14324B] tracking-tight flex items-center gap-2">
            <UserCircle2 className="w-6 h-6" /> Staff & Outlet Management
          </h1>
          <p className="text-[#2B2926]/60 text-sm mt-1">Manage cashier logins, update outlet passwords, and control counter access.</p>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="btn-primary text-xs py-2 flex items-center gap-2 cursor-pointer">
          <UserPlus className="w-4 h-4" /> Register Staff
        </button>
      </div>

      {error && <div className="p-4 rounded-md bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] text-sm">{error}</div>}

      <div className="retail-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Assigned Outlet</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-[#2B2926]/50">Loading...</td></tr>
              ) : users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-[#14324B] flex items-center justify-center text-white font-bold font-mono text-sm flex-shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-[#2B2926]">{u.name}</span>
                    </div>
                  </td>
                  <td className="text-[#2B2926]/70 text-sm font-mono">{u.email}</td>
                  <td>
                    <span className="badge-role bg-[#14324B]/10 text-[#14324B] font-semibold text-xs">
                      🏪 {u.role === 'owner' ? 'All Outlets' : (u.outlet || 'Outlet 1')}
                    </span>
                  </td>
                  <td>
                    <span className="badge-role flex items-center gap-1 w-max">
                      {u.role === 'owner' && <Shield className="w-3 h-3" />}
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${u.isActive ? 'status-in-stock' : 'status-out-of-stock'}`}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="px-2.5 py-1 rounded border border-[#E8E4DC] text-xs font-semibold text-[#14324B] hover:bg-[#14324B]/10 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Edit Details / Change Password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Change Password</span>
                      </button>

                      {u.role !== 'owner' && (
                        <button
                          onClick={() => toggleStatus(u._id, u.isActive)}
                          className={`px-2.5 py-1 rounded border text-xs font-semibold transition-colors cursor-pointer ${u.isActive ? 'bg-[#D64545]/10 border-[#D64545]/30 text-[#D64545] hover:bg-[#D64545]/20' : 'bg-[#2F9E44]/10 border-[#2F9E44]/30 text-[#2F9E44] hover:bg-[#2F9E44]/20'}`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && <UserFormModal onClose={() => setIsFormOpen(false)} onSuccess={fetchUsers} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSuccess={fetchUsers} />}
    </div>
  );
}

function EditUserModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    outlet: user.outlet || 'Outlet 1',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        outlet: formData.outlet
      };
      if (formData.password) {
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters.');
          setSubmitting(false);
          return;
        }
        payload.password = formData.password;
      }
      await api.put(`/users/${user._id}`, payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2B2926]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="retail-card max-w-md w-full p-6 animate-fade-in text-[#2B2926] bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E4DC] mb-4">
          <h2 className="text-lg font-bold text-[#14324B] flex items-center gap-2">
            <KeyRound className="w-5 h-5" /> Update Account & Password
          </h2>
          <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
        </div>

        <div className="mb-4 bg-[#FAF9F6] p-3 rounded border border-[#E8E4DC] text-xs">
          <div>Editing: <strong className="text-[#14324B]">{user.name}</strong> ({user.email})</div>
          <div className="text-[#2B2926]/60 mt-0.5">Role: {user.role?.toUpperCase()} &bull; Current Outlet: {user.outlet}</div>
        </div>

        {error && <div className="mb-4 text-[#D64545] text-xs bg-[#D64545]/10 p-3 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="form-label text-xs">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="form-input text-xs"
            />
          </div>

          <div>
            <label className="form-label text-xs">Phone Number</label>
            <input
              type="text"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="form-input text-xs"
            />
          </div>

          {user.role !== 'owner' && (
            <div>
              <label className="form-label text-xs">Assigned Outlet</label>
              <select
                value={formData.outlet}
                onChange={e => setFormData({ ...formData, outlet: e.target.value })}
                className="form-input text-xs"
              >
                <option value="Outlet 1">Outlet 1 (Stationary)</option>
                <option value="Outlet 2">Outlet 2 (General Store)</option>
              </select>
            </div>
          )}

          <div>
            <label className="form-label text-xs flex items-center justify-between">
              <span>New Password</span>
              <span className="text-[10px] text-[#2B2926]/50">Leave blank to keep current</span>
            </label>
            <input
              type="password"
              minLength={6}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="form-input font-mono text-xs"
              placeholder="Enter new password (min 6 chars)..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs py-2 px-4 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary text-xs py-2 px-4 flex items-center gap-2 cursor-pointer">
              {submitting ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserFormModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', outlet: 'Outlet 1' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users/staff', formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2B2926]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="retail-card max-w-md w-full p-6 animate-fade-in text-[#2B2926] bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E4DC] mb-4">
          <h2 className="text-lg font-bold text-[#14324B] flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Register Staff Account
          </h2>
          <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
        </div>
        {error && <div className="mb-4 text-[#D64545] text-xs bg-[#D64545]/10 p-3 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="form-label text-xs">Full Name *</label>
            <input type="text" required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="form-input text-xs" />
          </div>
          <div>
            <label className="form-label text-xs">Email Address *</label>
            <input type="email" required value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="form-input text-xs" />
          </div>
          <div>
            <label className="form-label text-xs">Assigned Outlet *</label>
            <select
              value={formData.outlet}
              onChange={e => setFormData({ ...formData, outlet: e.target.value })}
              className="form-input text-xs"
            >
              <option value="Outlet 1">Outlet 1 (Stationary)</option>
              <option value="Outlet 2">Outlet 2 (General Store)</option>
            </select>
          </div>
          <div>
            <label className="form-label text-xs">Staff Password *</label>
            <input type="password" required minLength={6} value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="form-input font-mono tracking-widest text-xs" placeholder="Min 6 characters" />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs py-2 px-4 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary text-xs py-2 px-4 flex items-center gap-2 cursor-pointer">
              {submitting ? 'Creating...' : <><Save className="w-4 h-4" /> Create Staff Login</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

