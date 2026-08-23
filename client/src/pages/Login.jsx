import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Store, Lock, Mail, ArrowRight, ShieldCheck, ShoppingCart, KeyRound, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('owner@retail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingOwner, setLoadingOwner] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // 1-Click Instant Login for Counter Staff (Outlet 1 or Outlet 2)
  const handleStaffDirectLogin = async (staffEmail, staffPassword, outletName) => {
    setError('');
    setLoadingStaff(staffEmail);
    const res = await login(staffEmail, staffPassword);
    setLoadingStaff(null);
    if (res.success) {
      navigate('/pos');
    } else {
      setError(res.message || `Failed to start ${outletName} session.`);
    }
  };

  // Owner Login (Requires Password)
  const handleOwnerSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoadingOwner(true);

    const res = await login(email, password);
    setLoadingOwner(false);
    if (res.success) {
      if (res.user?.role === 'staff') {
        navigate('/pos');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.message || 'Incorrect Owner password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-4 text-[#2B2926]">
      <div className="w-full max-w-md animate-fade-in space-y-5">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-white border border-[#E8E4DC] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Store className="w-8 h-8 text-[#14324B]" />
          </div>
          <h1 className="text-3xl font-bold text-[#14324B] tracking-tight mb-1" style={{ fontFamily: 'Sora' }}>
            Anjali Enterprises
          </h1>
          <p className="text-xs text-[#2B2926]/60">Dual-Outlet Retail & Inventory System</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* 1. Dual Counter Staff Direct Access (NO PASSWORD REQUIRED) */}
        <div className="retail-card p-5 bg-white border-2 border-[#2F9E44]/30 shadow-md hover:border-[#2F9E44] transition-all rounded-xl space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#2F9E44]/10 flex items-center justify-center text-[#2F9E44]">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-[#14324B]">Counter Staff Access</h2>
                <span className="inline-block text-[10px] font-bold text-[#2F9E44] bg-[#2F9E44]/10 px-2 py-0.5 rounded mt-0.5">
                  ✓ Instant Launch (2 Outlets)
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-[#2B2926]/60">
            Open counter till directly for billing, barcode scanning, and invoice printing.
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => handleStaffDirectLogin('staff1@retail.com', 'Staff@12345', 'Outlet 1')}
              disabled={loadingStaff || loadingOwner}
              className="py-2.5 px-3 rounded-lg bg-[#2F9E44] hover:bg-[#2F9E44]/90 text-white font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-sm text-center"
            >
              {loadingStaff === 'staff1@retail.com' ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span className="font-bold text-xs flex items-center gap-1">🏪 Outlet 1 <ArrowRight className="w-3.5 h-3.5" /></span>
                  <span className="text-[10px] opacity-80">Counter Staff 1</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleStaffDirectLogin('staff2@retail.com', 'Staff@12345', 'Outlet 2')}
              disabled={loadingStaff || loadingOwner}
              className="py-2.5 px-3 rounded-lg bg-[#14324B] hover:bg-[#14324B]/90 text-white font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-sm text-center"
            >
              {loadingStaff === 'staff2@retail.com' ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span className="font-bold text-xs flex items-center gap-1">🏪 Outlet 2 <ArrowRight className="w-3.5 h-3.5" /></span>
                  <span className="text-[10px] opacity-80">Counter Staff 2</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Store Owner Login (PASSWORD REQUIRED) */}
        <div className="retail-card p-5 bg-white shadow-md rounded-xl">
          <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-[#E8E4DC]">
            <div className="w-9 h-9 rounded-lg bg-[#14324B]/10 flex items-center justify-center text-[#14324B]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#14324B]">Store Owner Access</h2>
              <span className="inline-block text-[10px] font-semibold text-[#14324B] bg-[#14324B]/5 px-2 py-0.5 rounded mt-0.5">
                🔒 Password Required (Full Access)
              </span>
            </div>
          </div>

          <form onSubmit={handleOwnerSubmit} className="space-y-3.5">
            <div>
              <label className="form-label text-xs">Owner Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-9 text-xs font-medium"
                  placeholder="owner@retail.com"
                />
                <Mail className="w-4 h-4 text-[#2B2926]/40 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="form-label text-xs flex items-center justify-between">
                <span>Owner Password</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-9 text-xs font-mono"
                  placeholder="Enter Owner Password..."
                />
                <Lock className="w-4 h-4 text-[#2B2926]/40 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingOwner || loadingStaff}
              className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              {loadingOwner ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Unlock Owner Dashboard</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
