import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  UserCircle2,
  UserPlus,
  Shield,
  X,
  Save,
  KeyRound,
  Edit2,
  Phone,
  Mail,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetModalData, setResetModalData] = useState(null); // { tempPassword, userName, userPhone }

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

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this staff account? They will be unable to log in, but historical records will remain intact.')) {
      return;
    }
    try {
      const res = await api.put(`/users/${userId}/deactivate`);
      if (res.data.success) fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate user');
    }
  };

  const handleReactivate = async (userId) => {
    try {
      const res = await api.put(`/users/${userId}/reactivate`);
      if (res.data.success) fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reactivate user');
    }
  };

  const handleResetPassword = async (user) => {
    if (!window.confirm(`Reset password for ${user.name}? A temporary password will be generated and shown once.`)) {
      return;
    }
    try {
      const res = await api.post(`/users/${user._id}/reset-password`);
      if (res.data.success) {
        setResetModalData({
          userName: res.data.userName || user.name,
          userPhone: res.data.userPhone || user.phone,
          tempPassword: res.data.tempPassword
        });
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#2B2926]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14324B] tracking-tight flex items-center gap-2">
            <UserCircle2 className="w-6 h-6" /> Staff & Outlet Management
          </h1>
          <p className="text-[#2B2926]/60 text-sm mt-1">
            Manage cashier logins, reset passwords, and control outlet counter access.
          </p>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="btn-primary text-xs py-2 flex items-center gap-2 cursor-pointer shadow-xs">
          <UserPlus className="w-4 h-4" /> Register Staff
        </button>
      </div>

      {error && <div className="p-4 rounded-md bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] text-sm">{error}</div>}

      <div className="retail-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Phone (Login ID)</th>
                <th>Assigned Outlet</th>
                <th>Role</th>
                <th>Status</th>
                <th>Must Change Pwd</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-[#2B2926]/50">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-[#2B2926]/50">No staff members found.</td></tr>
              ) : users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-md flex items-center justify-center text-white font-bold font-mono text-sm shrink-0 ${u.role === 'owner' ? 'bg-[#14324B]' : 'bg-[#2F9E44]'}`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-[#2B2926]">{u.name}</span>
                        {u.email && <div className="text-[11px] text-[#2B2926]/50">{u.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-xs font-bold text-[#14324B] bg-[#FAF9F6] px-2 py-1 rounded border border-[#E8E4DC]">
                      {u.phone}
                    </span>
                  </td>
                  <td>
                    <span className="badge-role bg-[#14324B]/10 text-[#14324B] font-semibold text-xs">
                      🏪 {u.role === 'owner' ? 'All Outlets' : (u.outlet === 'Outlet 1' ? 'Stationary Outlet' : (u.outlet || 'Stationary Outlet'))}
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
                    {u.mustChangePassword ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#D64545]/10 text-[#D64545] border border-[#D64545]/20">
                        PENDING
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#2B2926]/40 font-mono">No</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {u.role !== 'owner' && (
                        <button
                          onClick={() => handleResetPassword(u)}
                          className="px-2 py-1 rounded border border-[#E8E4DC] text-[11px] font-semibold text-[#14324B] hover:bg-[#14324B]/10 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Reset Password (Generates Temporary Password)"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Reset Pwd</span>
                        </button>
                      )}

                      <button
                        onClick={() => setEditingUser(u)}
                        className="px-2 py-1 rounded border border-[#E8E4DC] text-[11px] font-semibold text-[#2B2926]/70 hover:text-[#14324B] hover:bg-[#FAF9F6] transition-colors flex items-center gap-1 cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      {u.role !== 'owner' && (
                        u.isActive ? (
                          <button
                            onClick={() => handleDeactivate(u._id)}
                            className="px-2 py-1 rounded border text-[11px] font-semibold transition-colors cursor-pointer bg-[#D64545]/10 border-[#D64545]/30 text-[#D64545] hover:bg-[#D64545]/20"
                            title="Deactivate Staff Account"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(u._id)}
                            className="px-2 py-1 rounded border text-[11px] font-semibold transition-colors cursor-pointer bg-[#2F9E44]/10 border-[#2F9E44]/30 text-[#2F9E44] hover:bg-[#2F9E44]/20"
                            title="Reactivate Staff Account"
                          >
                            Reactivate
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isFormOpen && <RegisterStaffModal onClose={() => setIsFormOpen(false)} onSuccess={fetchUsers} />}
      
      {/* Edit Staff Modal */}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSuccess={fetchUsers} />}

      {/* Feature 3: One-Time Temporary Password Display Modal */}
      {resetModalData && (
        <TemporaryPasswordModal
          data={resetModalData}
          onClose={() => setResetModalData(null)}
        />
      )}
    </div>
  );
}

function TemporaryPasswordModal({ data, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-[#2B2926]/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="retail-card max-w-md w-full p-6 animate-fade-in text-[#2B2926] bg-white rounded-2xl shadow-2xl border border-[#E8E4DC]">
        <div className="w-12 h-12 rounded-xl bg-[#2F9E44]/10 text-[#2F9E44] flex items-center justify-center mx-auto mb-3">
          <KeyRound className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-center text-[#14324B]">
          Temporary Password Generated
        </h3>
        <p className="text-xs text-[#2B2926]/60 text-center mt-1">
          Share this password with <strong>{data.userName}</strong> immediately.
        </p>

        <div className="my-5 p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E4DC] text-center space-y-2">
          <div className="text-[11px] text-[#2B2926]/60 uppercase tracking-wide font-semibold">
            New password for {data.userName} (Phone: {data.userPhone})
          </div>
          <div className="text-2xl font-bold font-mono text-[#14324B] tracking-wider py-1 select-all">
            {data.tempPassword}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="btn-secondary text-xs py-1.5 px-3 mx-auto flex items-center gap-1.5 cursor-pointer font-semibold"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#2F9E44]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to clipboard!' : 'Copy Password'}</span>
          </button>
        </div>

        <div className="p-3 rounded-lg bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] text-xs flex items-start gap-2 mb-5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-snug">
            <strong>Important:</strong> Share this with them now. It will not be shown again.
            On their next login, they will be forced to change it before accessing the app.
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full btn-primary py-2.5 text-xs font-bold cursor-pointer"
        >
          Done / Close
        </button>
      </div>
    </div>
  );
}

function RegisterStaffModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    outlet: 'Outlet 1',
    password: '',
    email: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const generateRandomPassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
    let pwd = 'Stf@';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pwd }));
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.password.trim()) {
      setError('Name, phone number, and password are required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/users/staff', formData);
      if (res.data.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Staff registration failed');
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
          <button onClick={onClose} className="btn-icon cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {error && (
          <div className="mb-4 text-[#D64545] text-xs bg-[#D64545]/10 border border-[#D64545]/30 p-3 rounded-lg font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="form-label text-xs">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="form-input text-xs"
              placeholder="e.g. Ramesh Kumar"
              autoFocus
            />
          </div>

          <div>
            <label className="form-label text-xs flex items-center justify-between">
              <span>Phone Number (Login ID) *</span>
              <span className="text-[10px] text-[#2B2926]/50">Unique across all staff</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="form-input pl-9 text-xs font-mono"
                placeholder="e.g. 9876543210"
              />
              <Phone className="w-4 h-4 text-[#2B2926]/40 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="form-label text-xs flex items-center justify-between">
              <span>Email Address</span>
              <span className="text-[10px] text-[#2B2926]/50">Optional</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="form-input pl-9 text-xs"
                placeholder="e.g. ramesh@example.com"
              />
              <Mail className="w-4 h-4 text-[#2B2926]/40 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="form-label text-xs">Assigned Outlet * (Staff restricted to this outlet)</label>
            <select
              value={formData.outlet}
              onChange={e => setFormData({ ...formData, outlet: e.target.value })}
              className="form-input text-xs font-semibold"
            >
              <option value="Outlet 1">Stationary Outlet (Outlet 1)</option>
              <option value="Outlet 2">Outlet 2 (General Store)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="form-label text-xs mb-0">Initial Password *</label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[11px] font-semibold text-[#14324B] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-[#2F9E44]" />
                <span>Generate Random</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="form-input pr-10 text-xs font-mono"
                placeholder="Min 6 characters..."
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#2B2926]/40 hover:text-[#14324B]"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E4DC] mt-4">
            <button type="button" onClick={onClose} className="btn-secondary text-xs py-2 px-4 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary text-xs py-2 px-4 flex items-center gap-2 cursor-pointer">
              {submitting ? 'Creating...' : <><Save className="w-4 h-4" /> Register Staff</>}
            </button>
          </div>
        </form>
      </div>
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
            <Edit2 className="w-5 h-5" /> Edit User Account
          </h2>
          <button onClick={onClose} className="btn-icon cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="mb-4 bg-[#FAF9F6] p-3 rounded border border-[#E8E4DC] text-xs">
          <div>Editing: <strong className="text-[#14324B]">{user.name}</strong> ({user.phone})</div>
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
            <label className="form-label text-xs">Phone Number *</label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="form-input text-xs font-mono"
            />
          </div>

          {user.role !== 'owner' && (
            <div>
              <label className="form-label text-xs">Assigned Outlet</label>
              <select
                value={formData.outlet}
                onChange={e => setFormData({ ...formData, outlet: e.target.value })}
                className="form-input text-xs font-semibold"
              >
                <option value="Outlet 1">Stationary Outlet</option>
                <option value="Outlet 2">Outlet 2 (General Store)</option>
              </select>
            </div>
          )}

          <div>
            <label className="form-label text-xs flex items-center justify-between">
              <span>Direct Password Change</span>
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

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E4DC] mt-4">
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
