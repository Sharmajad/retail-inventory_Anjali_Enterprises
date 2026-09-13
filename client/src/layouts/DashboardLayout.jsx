import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  Truck,
  BarChart3,
  LogOut,
  Store,
  Menu,
  X,
  ShieldCheck,
  UserCircle2,
  ArrowLeftRight,
  Lock,
  KeyRound,
  AlertCircle,
  Download
} from 'lucide-react';
import ChangePasswordModal from '../components/ChangePasswordModal';

export default function DashboardLayout() {
  const { user, logout, isOwner, switchAccount, login } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Owner Password Verification Modal State (when switching from Staff -> Owner)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [ownerPasswordInput, setOwnerPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchToStaff = async (targetOutlet) => {
    setSwitching(true);
    const res = await switchAccount(targetOutlet === 'Outlet 2' ? 'staff2' : 'staff1');
    setSwitching(false);
    if (res.success) {
      navigate('/pos');
    }
  };

  const handleSwitchClick = async () => {
    if (isOwner) {
      // Owner -> Staff 1 by default
      handleSwitchToStaff('Outlet 1');
    } else {
      // Staff -> Owner: Prompt for Owner password
      setOwnerPasswordInput('');
      setPasswordError('');
      setIsPasswordModalOpen(true);
    }
  };

  const handleVerifyOwnerPassword = async (e) => {
    e.preventDefault();
    if (!ownerPasswordInput.trim()) {
      setPasswordError('Please enter the owner password.');
      return;
    }

    setPasswordError('');
    setVerifying(true);

    const res = await login('owner@retail.com', ownerPasswordInput);
    setVerifying(false);

    if (res.success) {
      setIsPasswordModalOpen(false);
      setOwnerPasswordInput('');
      navigate('/dashboard');
    } else {
      setPasswordError(res.message || 'Incorrect owner password. Access denied.');
    }
  };

  const navItems = [
    { label: 'Dashboard',          path: '/dashboard', icon: LayoutDashboard, ownerOnly: false },
    { label: 'POS Checkout',       path: '/pos',        icon: ShoppingCart,    ownerOnly: false },
    { label: 'Product Catalog',    path: '/products',   icon: Package,         ownerOnly: false },
    { label: 'Sales History',      path: '/sales',      icon: Receipt,         ownerOnly: false },
    { label: 'Purchases & Restock',path: '/purchases',  icon: Truck,           ownerOnly: true  },
    { label: 'Business Reports',   path: '/reports',    icon: BarChart3,       ownerOnly: true  },
    { label: 'Staff Users',        path: '/users',      icon: UserCircle2,     ownerOnly: true  },
    { label: 'Export Data',        path: '/export',     icon: Download,        ownerOnly: true  }
  ];

  const currentOutletLabel = isOwner
    ? 'All Outlets'
    : (user?.outlet === 'Outlet 1' ? 'Stationary Outlet' : (user?.outlet || 'Stationary Outlet'));

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2B2926] flex">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#E8E4DC]">
          <div className="flex items-center gap-3">
            <Store className="w-6 h-6 text-[#14324B]" />
            <div>
              <div className="font-bold text-[#14324B] text-lg tracking-tight leading-none" style={{ fontFamily: 'Sora' }}>
                Anjali Enterprises
              </div>
              <div className="text-[10px] text-[#2B2926]/60 mt-1 font-bold flex items-center gap-1">
                <span>🏪 {currentOutletLabel}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-[#2B2926]/50 hover:text-[#2B2926] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="py-6 flex-1 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            if (item.ownerOnly && !isOwner) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${window.location.pathname === item.path ? 'text-[#14324B]' : 'text-[#2B2926]/50'}`} />
                <span>{item.label}</span>
                {item.ownerOnly && (
                  <span className="ml-auto text-[9px] font-bold text-[#14324B] bg-[#FAF9F6] border border-[#E8E4DC] px-1.5 py-0.5 rounded uppercase">
                    Owner
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Sidebar Footer User Info & Role Switch */}
        <div className="p-4 border-t border-[#E8E4DC] bg-[#FAF9F6] space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-md flex items-center justify-center text-white font-bold font-mono ${isOwner ? 'bg-[#14324B]' : 'bg-[#2F9E44]'}`}>
              {user?.name ? user.name.charAt(0).toUpperCase() : (isOwner ? 'O' : 'S')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[#2B2926] truncate">{user?.name || (isOwner ? 'Store Owner' : 'Counter Staff')}</div>
              <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                {isOwner ? (
                  <span className="badge-role bg-[#14324B]/10 text-[#14324B]">👑 Store Owner</span>
                ) : (
                  <span className="badge-role bg-[#2F9E44]/10 text-[#2F9E44]">💳 {user?.outlet === 'Outlet 1' ? 'Stationary Staff' : (user?.outlet || 'Stationary Staff')}</span>
                )}
              </div>
            </div>
          </div>

          {isOwner ? (
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() => handleSwitchToStaff('Outlet 1')}
                disabled={switching}
                className="py-1 px-2 rounded text-[11px] font-semibold bg-white border border-[#E8E4DC] hover:border-[#2F9E44] text-[#2F9E44] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="Switch to Staff (Stationary Outlet)"
              >
                <span>💳 Stationary</span>
              </button>
              <button
                onClick={() => handleSwitchToStaff('Outlet 2')}
                disabled={switching}
                className="py-1 px-2 rounded text-[11px] font-semibold bg-white border border-[#E8E4DC] hover:border-[#14324B] text-[#14324B] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="Switch to Staff (Outlet 2)"
              >
                <span>💳 Outlet 2</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleSwitchClick}
              disabled={switching}
              className="w-full py-1.5 px-2.5 rounded text-xs font-semibold bg-white border border-[#E8E4DC] hover:border-[#14324B] text-[#14324B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Switch to Owner (Password required)"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Switch to Owner 🔒</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden btn-icon cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm font-medium text-[#2B2926]/70 hidden sm:flex items-center gap-2">
              <span>Welcome, <strong className="text-[#14324B]">{user?.name || (isOwner ? 'Store Owner' : 'Counter Staff')}</strong></span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#14324B]/5 border border-[#14324B]/20 text-[#14324B] font-semibold">
                🏪 {currentOutletLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isOwner ? (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => handleSwitchToStaff('Outlet 1')}
                  disabled={switching}
                  className="text-xs font-semibold py-1.5 px-2.5 rounded-lg bg-white border border-[#E8E4DC] hover:border-[#2F9E44] text-[#2F9E44] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Stationary POS</span>
                </button>
                <button
                  onClick={() => handleSwitchToStaff('Outlet 2')}
                  disabled={switching}
                  className="text-xs font-semibold py-1.5 px-2.5 rounded-lg bg-white border border-[#E8E4DC] hover:border-[#14324B] text-[#14324B] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Outlet 2 POS</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleSwitchClick}
                disabled={switching}
                className="hidden sm:flex text-xs font-semibold py-1.5 px-3 rounded-lg bg-white border border-[#E8E4DC] hover:border-[#14324B] text-[#14324B] items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#14324B]" />
                <span>Switch to Owner 🔒</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-[#2B2926]/60 hover:text-[#D64545] flex items-center gap-1.5 transition-colors px-2 py-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      {/* Owner Password Prompt Modal (When switching from Staff -> Owner) */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-[#2B2926]/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="retail-card max-w-sm w-full bg-white rounded-xl shadow-2xl p-6 animate-fade-in text-[#2B2926]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E4DC] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#14324B]/10 flex items-center justify-center text-[#14324B]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#14324B]">Enter Owner Password</h3>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded text-[#2B2926]/40 hover:text-[#D64545] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#2B2926]/60 mb-4">
              Owner credentials are required to unlock dashboard reports, inventory restock, and user settings.
            </p>

            {passwordError && (
              <div className="mb-4 p-2.5 rounded bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] text-xs flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOwnerPassword} className="space-y-4">
              <div>
                <label className="form-label text-xs">Owner Password</label>
                <div className="relative">
                  <input
                    type="password"
                    autoFocus
                    required
                    value={ownerPasswordInput}
                    onChange={(e) => setOwnerPasswordInput(e.target.value)}
                    className="form-input pl-9 text-xs font-mono"
                    placeholder="Enter Owner Password..."
                  />
                  <Lock className="w-4 h-4 text-[#2B2926]/40 absolute left-3 top-3" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-3 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer"
                >
                  {verifying ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Unlock Owner Mode</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Force Change Password Modal if mustChangePassword is true */}
      <ChangePasswordModal isOpen={!!user?.mustChangePassword} />
    </div>
  );
}
