import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Receipt,
  ShoppingBag,
  Package,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
  Store,
  Banknote,
  CreditCard,
  QrCode,
  Building2,
  TrendingUp,
  Percent
} from 'lucide-react';

export default function Dashboard() {
  const { user, isOwner } = useAuth();
  const [selectedOutlet, setSelectedOutlet] = useState(isOwner ? 'All' : (user?.outlet || 'Outlet 1'));
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/dashboard-summary', {
        params: { outlet: selectedOutlet }
      });
      if (res.data.success) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      setError('Failed to load dashboard summary metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedOutlet]);

  const totalRev = summary?.todayRevenue || 0;
  const cashRev = summary?.todayCashRevenue || 0;
  const onlineRev = summary?.todayOnlineRevenue || 0;
  const cashPercent = totalRev > 0 ? ((cashRev / totalRev) * 100).toFixed(1) : 0;
  const onlinePercent = totalRev > 0 ? ((onlineRev / totalRev) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-8 animate-fade-in text-[#2B2926]">
      {/* Top Header & Outlet Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#14324B]/10 text-[#14324B] border border-[#14324B]/20 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>{selectedOutlet === 'All' ? 'Consolidated (All Outlets)' : (selectedOutlet === 'Outlet 1' ? 'Stationary Outlet (Stationary Only)' : selectedOutlet)}</span>
            </span>
          </div>
          <h1 className="text-3xl font-bold text-[#14324B] tracking-tight">Today's Overview</h1>
          <p className="text-sm text-[#2B2926]/70 mt-1">
            Store performance and payment metrics for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {isOwner && (
            <div className="flex bg-white p-1 rounded-lg border border-[#E8E4DC] shadow-2xs">
              <button
                onClick={() => setSelectedOutlet('All')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  selectedOutlet === 'All' ? 'bg-[#14324B] text-white shadow-sm' : 'text-[#2B2926]/70 hover:text-[#14324B]'
                }`}
              >
                All Outlets
              </button>
              <button
                onClick={() => setSelectedOutlet('Outlet 1')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  selectedOutlet === 'Outlet 1' ? 'bg-[#14324B] text-white shadow-sm' : 'text-[#2B2926]/70 hover:text-[#14324B]'
                }`}
              >
                🏪 Stationary Outlet
              </button>
              <button
                onClick={() => setSelectedOutlet('Outlet 2')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  selectedOutlet === 'Outlet 2' ? 'bg-[#14324B] text-white shadow-sm' : 'text-[#2B2926]/70 hover:text-[#14324B]'
                }`}
              >
                🏪 Outlet 2
              </button>
            </div>
          )}

          <button
            onClick={fetchSummary}
            className="btn-secondary text-xs flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] text-sm font-medium">
          {error}
        </div>
      )}

      {/* ── 1. OWNER FINANCIAL METRICS ── */}
      {isOwner && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#14324B] flex items-center gap-2">
              <span>Financial Summary</span>
              {selectedOutlet !== 'All' && (
                <span className="text-xs font-normal text-[#2B2926]/60">({selectedOutlet})</span>
              )}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gross Revenue Receipt */}
            <div className="receipt-card p-6">
              <div className="text-xs font-semibold text-[#2B2926]/60 uppercase tracking-wider">Gross Revenue</div>
              <div className="receipt-divider"></div>
              <div className="text-4xl font-bold text-[#14324B] font-mono">
                ₹{loading ? '---' : totalRev.toFixed(2)}
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[#2B2926]/60">
                <ArrowUpRight className="w-4 h-4" /> Total collections today
              </div>
            </div>

            {/* COGS Receipt */}
            <div className="receipt-card p-6">
              <div className="text-xs font-semibold text-[#2B2926]/60 uppercase tracking-wider">Cost of Goods</div>
              <div className="receipt-divider"></div>
              <div className="text-4xl font-bold text-[#2B2926] font-mono">
                ₹{loading ? '---' : (summary?.todayCost || 0).toFixed(2)}
              </div>
              <div className="mt-4 text-xs font-medium text-[#2B2926]/60">
                Purchase cost of items sold
              </div>
            </div>

            {/* Net Profit Receipt */}
            <div className="receipt-card p-6 border-[#2F9E44]/30 bg-[#2F9E44]/5">
              <div className="text-xs font-bold text-[#2F9E44] uppercase tracking-wider">Net Profit</div>
              <div className="border-t-2 border-dashed border-[#2F9E44]/30 my-4 w-full"></div>
              <div className="text-4xl font-bold text-[#2F9E44] font-mono">
                ₹{loading ? '---' : (summary?.todayNetProfit || 0).toFixed(2)}
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[#2F9E44]">
                <CheckCircle2 className="w-4 h-4" /> Revenue minus item cost
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 2. CASH VS ONLINE PAYMENT BREAKDOWN (Requirement 1) ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#14324B] flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#14324B]" />
            <span>Payment Channels Breakdown (Today)</span>
          </h2>
          {totalRev > 0 && (
            <div className="text-xs font-mono font-bold text-[#2B2926]/70">
              Cash: <span className="text-[#2F9E44]">{cashPercent}%</span> | Online: <span className="text-[#14324B]">{onlinePercent}%</span>
            </div>
          )}
        </div>

        {/* Visual Share Bar */}
        {totalRev > 0 && (
          <div className="w-full bg-[#E8E4DC] h-3 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${cashPercent}%` }}
              className="bg-[#2F9E44] h-full transition-all duration-500"
              title={`Cash: ₹${cashRev.toFixed(2)} (${cashPercent}%)`}
            />
            <div
              style={{ width: `${onlinePercent}%` }}
              className="bg-[#14324B] h-full transition-all duration-500"
              title={`Online: ₹${onlineRev.toFixed(2)} (${onlinePercent}%)`}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cash Payment Card */}
          <div className="retail-card p-6 border-l-4 border-l-[#2F9E44] bg-white shadow-sm hover:shadow transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#2F9E44] font-bold text-xs uppercase tracking-wider">
                  <Banknote className="w-4 h-4" />
                  <span>Cash Collections</span>
                </div>
                <div className="text-3xl font-bold font-mono text-[#2B2926] mt-2">
                  ₹{loading ? '---' : cashRev.toFixed(2)}
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#2F9E44]/10 text-[#2F9E44] font-bold text-xs font-mono">
                {loading ? '--' : `${cashPercent}%`}
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E8E4DC] flex items-center justify-between text-xs text-[#2B2926]/70">
              <span>Cash Transactions:</span>
              <span className="font-bold text-[#2B2926] font-mono">{summary?.todayCashCount || 0} invoices</span>
            </div>
          </div>

          {/* Online Payment Card */}
          <div className="retail-card p-6 border-l-4 border-l-[#14324B] bg-white shadow-sm hover:shadow transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#14324B] font-bold text-xs uppercase tracking-wider">
                  <QrCode className="w-4 h-4" />
                  <span>Online / Digital Collections</span>
                </div>
                <div className="text-3xl font-bold font-mono text-[#14324B] mt-2">
                  ₹{loading ? '---' : onlineRev.toFixed(2)}
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#14324B]/10 text-[#14324B] font-bold text-xs font-mono">
                {loading ? '--' : `${onlinePercent}%`}
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E8E4DC] flex items-center justify-between text-xs text-[#2B2926]/70">
              <div className="flex items-center gap-3">
                <span>UPI: <strong className="text-[#14324B] font-mono">₹{(summary?.todayUpiRevenue || 0).toFixed(2)}</strong></span>
                <span>Card: <strong className="text-[#14324B] font-mono">₹{(summary?.todayCardRevenue || 0).toFixed(2)}</strong></span>
              </div>
              <span className="font-bold text-[#14324B] font-mono">{summary?.todayOnlineCount || 0} invoices</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. DUAL OUTLET TODAY COMPARISON (When viewing All as Owner) ── */}
      {isOwner && selectedOutlet === 'All' && summary?.outletBreakdown && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#14324B] flex items-center gap-2">
            <Store className="w-5 h-5 text-[#14324B]" />
            <span>Outlet Performance (Today)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['Outlet 1', 'Outlet 2'].map(outName => {
              const outData = summary.outletBreakdown[outName] || { revenue: 0, cost: 0, profit: 0, invoices: 0, cash: 0, online: 0 };
              const displayName = outName === 'Outlet 1' ? 'Stationary Outlet' : 'Outlet 2';
              return (
                <div key={outName} className="retail-card p-5 bg-white border border-[#E8E4DC] rounded-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E8E4DC]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#14324B]/10 flex items-center justify-center text-[#14324B] font-bold text-xs">
                        {outName === 'Outlet 1' ? 'ST' : 'O2'}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#14324B]">{displayName}</h3>
                        <p className="text-[11px] text-[#2B2926]/50">
                          {outName === 'Outlet 1' ? 'Stationary Dept (staff1@retail.com)' : 'General Store (staff2@retail.com)'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#14324B] bg-[#FAF9F6] px-2.5 py-1 rounded border border-[#E8E4DC]">
                      {outData.invoices} Sales
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div className="p-3 bg-[#FAF9F6] rounded-lg border border-[#E8E4DC]">
                      <div className="text-[10px] text-[#2B2926]/60 uppercase font-semibold">Revenue</div>
                      <div className="text-lg font-bold text-[#14324B] mt-1">₹{outData.revenue.toFixed(2)}</div>
                    </div>
                    <div className="p-3 bg-[#2F9E44]/5 rounded-lg border border-[#2F9E44]/20">
                      <div className="text-[10px] text-[#2F9E44] uppercase font-bold">Net Profit</div>
                      <div className="text-lg font-bold text-[#2F9E44] mt-1">₹{outData.profit.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 font-mono text-[#2B2926]/70">
                    <div className="flex items-center justify-between p-2 bg-white rounded border border-[#E8E4DC]">
                      <span>💵 Cash:</span>
                      <strong className="text-[#2B2926]">₹{outData.cash.toFixed(2)}</strong>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded border border-[#E8E4DC]">
                      <span>📱 Online:</span>
                      <strong className="text-[#14324B]">₹{outData.online.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 4. OPERATIONAL STATS GRID ── */}
      <section>
        <h2 className="text-lg font-semibold text-[#14324B] mb-4">Operations & Inventory</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="retail-card p-5 flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-[#2B2926]/60 uppercase tracking-wider mb-2">Invoices Issued</div>
              <div className="text-2xl font-bold text-[#14324B] font-mono">{loading ? '--' : (summary?.todayInvoicesCount || 0)}</div>
            </div>
            <div className="p-2.5 bg-[#FAF9F6] rounded-md text-[#2B2926] border border-[#E8E4DC]">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

          <div className="retail-card p-5 flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-[#2B2926]/60 uppercase tracking-wider mb-2">Items Sold</div>
              <div className="text-2xl font-bold text-[#14324B] font-mono">{loading ? '--' : (summary?.todayItemsSold || 0)}</div>
            </div>
            <div className="p-2.5 bg-[#FAF9F6] rounded-md text-[#2B2926] border border-[#E8E4DC]">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="retail-card p-5 flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-[#2B2926]/60 uppercase tracking-wider mb-2">Active Catalog</div>
              <div className="text-2xl font-bold text-[#14324B] font-mono">{loading ? '--' : (summary?.totalActiveProducts || 0)}</div>
            </div>
            <div className="p-2.5 bg-[#FAF9F6] rounded-md text-[#2B2926] border border-[#E8E4DC]">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="retail-card p-5 flex items-start justify-between border-[#D98E04]/40 bg-[#D98E04]/5">
            <div>
              <div className="text-xs font-semibold text-[#D98E04] uppercase tracking-wider mb-2">Low Stock Alerts</div>
              <div className="text-2xl font-bold text-[#D98E04] font-mono">{loading ? '--' : (summary?.lowStockCount || 0)}</div>
            </div>
            <div className="p-2.5 bg-white rounded-md text-[#D98E04] border border-[#D98E04]/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
