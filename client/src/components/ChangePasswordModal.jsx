import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, KeyRound, ShieldAlert, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function ChangePasswordModal({ isOpen }) {
  const { changePassword, user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    const res = await changePassword(newPassword);
    setSubmitting(false);

    if (!res.success) {
      setError(res.message || 'Failed to update password.');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#14324B]/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="retail-card max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 md:p-8 animate-fade-in border border-[#E8E4DC]">
        
        <div className="w-14 h-14 rounded-2xl bg-[#D64545]/10 flex items-center justify-center text-[#D64545] mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-[#14324B] tracking-tight">
            Password Change Required
          </h2>
          <p className="text-xs text-[#2B2926]/70 mt-1.5 leading-relaxed">
            Welcome, <strong>{user?.name}</strong>. Your password was reset by the store owner. 
            For security, please choose a new private password before accessing the system.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label text-xs font-semibold">New Password (min. 6 characters)</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="form-input pl-9 pr-10 text-xs font-mono"
                placeholder="Enter new password..."
                autoFocus
              />
              <Lock className="w-4 h-4 text-[#2B2926]/40 absolute left-3 top-3" />
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

          <div>
            <label className="form-label text-xs font-semibold">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="form-input pl-9 pr-10 text-xs font-mono"
                placeholder="Confirm new password..."
              />
              <KeyRound className="w-4 h-4 text-[#2B2926]/40 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer mt-2 shadow-sm"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Set New Password & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <span className="text-[11px] text-[#2B2926]/50">
            🔒 Account login ID: <span className="font-mono font-semibold text-[#14324B]">{user?.phone || user?.email}</span>
          </span>
        </div>

      </div>
    </div>
  );
}
