import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Store, Lock, Mail, ArrowRight, ShieldCheck, ShoppingCart, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [selectedPortal, setSelectedPortal] = useState('outlet1'); // 'outlet1' | 'outlet2' | 'owner' | 'custom'
  const [identifier, setIdentifier] = useState('staff1@retail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePortalSelect = (portal) => {
    setSelectedPortal(portal);
    setError('');
    setPassword('');
    if (portal === 'outlet1') {
      setIdentifier('staff1@retail.com');
    } else if (portal === 'outlet2') {
      setIdentifier('staff2@retail.com');
    } else if (portal === 'owner') {
      setIdentifier('owner@retail.com');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your phone number or email.');
      return;
    }
    if (!password) {
      setError('Please enter password.');
      return;
    }
    setError('');
    setLoading(true);

    const res = await login(identifier.trim(), password);
    setLoading(false);
    if (res.success) {
      if (res.user?.role === 'staff') {
        navigate('/pos');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.message || 'Incorrect credentials. Please check your login ID / password and try again.');
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

        {/* Portal / Outlet Selection Tabs */}
        <div className="retail-card p-4 bg-white border border-[#E8E4DC] shadow-sm rounded-xl">
          <div className="text-xs font-bold text-[#14324B] mb-2.5">Select Login Outlet / Role:</div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handlePortalSelect('outlet1')}
              className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                selectedPortal === 'outlet1'
                  ? 'bg-[#14324B] text-white border-[#14324B] shadow-sm'
                  : 'bg-[#FAF9F6] text-[#2B2926]/80 border-[#E8E4DC] hover:border-[#14324B]'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="font-bold text-[11px]">Stationary Outlet</span>
              <span className="text-[9px] opacity-75 truncate">Stationary Only</span>
            </button>

            <button
              type="button"
              onClick={() => handlePortalSelect('outlet2')}
              className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                selectedPortal === 'outlet2'
                  ? 'bg-[#14324B] text-white border-[#14324B] shadow-sm'
                  : 'bg-[#FAF9F6] text-[#2B2926]/80 border-[#E8E4DC] hover:border-[#14324B]'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="font-bold text-[11px]">Outlet 2</span>
              <span className="text-[9px] opacity-75 truncate">General Store</span>
            </button>

            <button
              type="button"
              onClick={() => handlePortalSelect('owner')}
              className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                selectedPortal === 'owner'
                  ? 'bg-[#14324B] text-white border-[#14324B] shadow-sm'
                  : 'bg-[#FAF9F6] text-[#2B2926]/80 border-[#E8E4DC] hover:border-[#14324B]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="font-bold text-[11px]">Owner</span>
              <span className="text-[9px] opacity-75 truncate">Full Access</span>
            </button>
          </div>
        </div>

        {/* Login Password Form */}
        <div className="retail-card p-5 bg-white shadow-md rounded-xl border border-[#E8E4DC]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E4DC] mb-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#14324B]" />
              <h2 className="font-bold text-sm text-[#14324B]">
                {selectedPortal === 'outlet1' && 'Stationary Outlet Staff Login'}
                {selectedPortal === 'outlet2' && 'Outlet 2 Staff Login'}
                {selectedPortal === 'owner' && 'Owner Security Login'}
                {selectedPortal === 'custom' && 'Account Login'}
              </h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#14324B]/5 text-[#14324B]">
              🔒 Password Protected
            </span>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="form-label text-xs">Phone Number or Email</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setSelectedPortal('custom');
                  }}
                  className="form-input pl-9 text-xs font-medium"
                  placeholder="Enter phone number or email..."
                />
                <Mail className="w-4 h-4 text-[#2B2926]/40 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="form-label text-xs flex items-center justify-between">
                <span>Enter Password</span>
                <span className="text-[10px] text-[#2B2926]/50">Required</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-9 pr-10 text-xs font-mono"
                  placeholder="Enter password..."
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

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-xs py-3 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Sign In to {selectedPortal === 'owner' ? 'Dashboard' : 'Counter POS'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

