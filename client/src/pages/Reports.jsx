import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Search,
  PieChart,
  Activity,
  RefreshCw,
  Award,
  AlertCircle,
  Building2,
  Calendar,
  CreditCard,
  Banknote,
  DollarSign,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Tags
} from 'lucide-react';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('monthly'); // 'monthly' | 'sales' | 'inventory'

  // Monthly Statistics State
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [monthlyOutlet, setMonthlyOutlet] = useState('All');
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Sales Analytics State
  const [salesAnalytics, setSalesAnalytics] = useState(null);
  const [salesOutlet, setSalesOutlet] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesLoading, setSalesLoading] = useState(false);

  // Inventory Valuation State
  const [inventoryValuation, setInventoryValuation] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'monthly') {
      fetchMonthlyStatistics();
    } else if (activeTab === 'sales') {
      fetchSalesAnalytics();
    } else if (activeTab === 'inventory') {
      fetchInventoryValuation();
    }
  }, [activeTab, selectedMonth, monthlyOutlet, salesOutlet, startDate, endDate]);

  const fetchMonthlyStatistics = async () => {
    setMonthlyLoading(true);
    try {
      const res = await api.get('/reports/monthly-statistics', {
        params: { month: selectedMonth, outlet: monthlyOutlet }
      });
      if (res.data.success) setMonthlyStats(res.data);
    } catch (err) {
      console.error('Failed to load monthly stats', err);
    } finally {
      setMonthlyLoading(false);
    }
  };

  const fetchSalesAnalytics = async () => {
    setSalesLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (salesOutlet && salesOutlet !== 'All') params.outlet = salesOutlet;
      const res = await api.get('/reports/sales-analytics', { params });
      if (res.data.success) setSalesAnalytics(res.data.analytics);
    } catch (err) {
      console.error('Failed to load sales analytics', err);
    } finally {
      setSalesLoading(false);
    }
  };

  const fetchInventoryValuation = async () => {
    setInventoryLoading(true);
    try {
      const res = await api.get('/reports/inventory-valuation');
      if (res.data.success) setInventoryValuation(res.data.valuation);
    } catch (err) {
      console.error('Failed to load inventory valuation', err);
    } finally {
      setInventoryLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#2B2926]">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14324B] flex items-center gap-2">
            <BarChart3 className="w-6 h-6" /> Executive Reports & Analytics
          </h1>
          <p className="text-[#2B2926]/60 text-sm mt-1">
            Analyze monthly product performance, profit margins, and outlet breakdown.
          </p>
        </div>

        <div className="flex bg-white p-1 rounded-lg border border-[#E8E4DC] shadow-2xs self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'monthly' ? 'bg-[#14324B] text-white shadow-sm' : 'text-[#2B2926]/60 hover:text-[#14324B]'
            }`}
          >
            📊 Monthly Statistics
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sales' ? 'bg-[#14324B] text-white shadow-sm' : 'text-[#2B2926]/60 hover:text-[#14324B]'
            }`}
          >
            📈 Sales Analytics
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'inventory' ? 'bg-[#14324B] text-white shadow-sm' : 'text-[#2B2926]/60 hover:text-[#14324B]'
            }`}
          >
            📦 Valuation
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: MONTHLY STATISTICS (Requirement 3) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="retail-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#14324B]" />
                <span className="text-xs font-bold text-[#14324B]">Select Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="form-input text-xs w-44 font-mono font-bold"
                />
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#14324B]" />
                <span className="text-xs font-bold text-[#14324B]">Outlet:</span>
                <select
                  value={monthlyOutlet}
                  onChange={e => setMonthlyOutlet(e.target.value)}
                  className="form-input text-xs w-36 font-semibold"
                >
                  <option value="All">All Outlets</option>
                  <option value="Outlet 1">Outlet 1</option>
                  <option value="Outlet 2">Outlet 2</option>
                </select>
              </div>
            </div>

            <button
              onClick={fetchMonthlyStatistics}
              className="btn-secondary text-xs flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${monthlyLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Report</span>
            </button>
          </div>

          {monthlyLoading ? (
            <div className="py-16 text-center text-[#2B2926]/50">Loading Monthly Statistics...</div>
          ) : !monthlyStats ? (
            <div className="py-16 text-center text-[#2B2926]/50">No data found for the selected month.</div>
          ) : (
            <>
              {/* Financial Snapshot Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="receipt-card p-5">
                  <div className="text-xs font-semibold text-[#2B2926]/60 uppercase tracking-wider">Monthly Revenue</div>
                  <div className="receipt-divider"></div>
                  <div className="text-3xl font-bold text-[#14324B] font-mono">
                    ₹{monthlyStats.metrics.totalRevenue.toFixed(2)}
                  </div>
                  <div className="mt-2 text-xs text-[#2B2926]/60">
                    {monthlyStats.metrics.totalInvoices} invoices ({monthlyStats.metrics.totalItemsSold} items)
                  </div>
                </div>

                <div className="receipt-card p-5">
                  <div className="text-xs font-semibold text-[#2B2926]/60 uppercase tracking-wider">Total COGS (Cost)</div>
                  <div className="receipt-divider"></div>
                  <div className="text-3xl font-bold text-[#2B2926] font-mono">
                    ₹{monthlyStats.metrics.totalCost.toFixed(2)}
                  </div>
                  <div className="mt-2 text-xs text-[#2B2926]/60">
                    Average Order: ₹{monthlyStats.metrics.averageOrderValue.toFixed(2)}
                  </div>
                </div>

                <div className="receipt-card p-5 border-[#2F9E44]/30 bg-[#2F9E44]/5">
                  <div className="text-xs font-bold text-[#2F9E44] uppercase tracking-wider">Net Profit</div>
                  <div className="border-t-2 border-dashed border-[#2F9E44]/30 my-4"></div>
                  <div className="text-3xl font-bold text-[#2F9E44] font-mono">
                    ₹{monthlyStats.metrics.netProfit.toFixed(2)}
                  </div>
                  <div className="mt-2 text-xs font-bold text-[#2F9E44]">
                    Margin: {monthlyStats.metrics.profitMargin.toFixed(1)}%
                  </div>
                </div>

                <div className="receipt-card p-5">
                  <div className="text-xs font-semibold text-[#2B2926]/60 uppercase tracking-wider">Cash vs Online</div>
                  <div className="receipt-divider"></div>
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between items-center text-[#2F9E44]">
                      <span>💵 Cash:</span>
                      <strong>₹{monthlyStats.metrics.paymentBreakdown.cashRevenue.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between items-center text-[#14324B]">
                      <span>📱 Online:</span>
                      <strong>₹{monthlyStats.metrics.paymentBreakdown.onlineRevenue.toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-[#2B2926]/50">
                    UPI: ₹{monthlyStats.metrics.paymentBreakdown.upiRevenue.toFixed(0)} | Card: ₹{monthlyStats.metrics.paymentBreakdown.cardRevenue.toFixed(0)}
                  </div>
                </div>
              </div>

              {/* Outlet Comparative Snapshot (When viewing All Outlets) */}
              {monthlyOutlet === 'All' && monthlyStats.outletComparison && (
                <div className="retail-card p-5 bg-white border border-[#E8E4DC]">
                  <h3 className="font-bold text-[#14324B] text-sm mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#14324B]" />
                    <span>{monthlyStats.monthName} — Outlet 1 vs Outlet 2 Performance</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['Outlet 1', 'Outlet 2'].map(outName => {
                      const outData = monthlyStats.outletComparison[outName] || { revenue: 0, profit: 0, invoices: 0, itemsSold: 0, cash: 0, online: 0, topItem: null };
                      return (
                        <div key={outName} className="p-4 rounded-lg bg-[#FAF9F6] border border-[#E8E4DC] space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-[#E8E4DC]">
                            <span className="font-bold text-sm text-[#14324B]">🏪 {outName}</span>
                            <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-[#E8E4DC]">
                              {outData.invoices} Sales
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            <div>Revenue: <strong className="text-[#14324B]">₹{outData.revenue.toFixed(2)}</strong></div>
                            <div>Net Profit: <strong className="text-[#2F9E44]">₹{outData.profit.toFixed(2)}</strong></div>
                            <div>Cash: ₹{outData.cash.toFixed(2)}</div>
                            <div>Online: ₹{outData.online.toFixed(2)}</div>
                          </div>

                          {outData.topItem && (
                            <div className="text-xs bg-white p-2 rounded border border-[#E8E4DC] flex items-center justify-between">
                              <span className="text-[#2B2926]/70 text-[11px]">Top Selling Item:</span>
                              <strong className="text-[#14324B] text-xs">{outData.topItem.name} ({outData.topItem.quantity} pcs)</strong>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── SALES BY CATEGORY BREAKDOWN ── */}
              {monthlyStats.salesByCategory && monthlyStats.salesByCategory.length > 0 && (
                <div className="retail-card overflow-hidden bg-white border border-[#E8E4DC]">
                  <div className="p-4 border-b border-[#E8E4DC] bg-[#FAF9F6] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-[#14324B]/10 text-[#14324B] flex items-center justify-center font-bold">
                        <Tags className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#14324B]">Monthly Sales & Profit by Category</h3>
                        <p className="text-[11px] text-[#2B2926]/50">Performance, volume, and revenue contribution across material categories</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#14324B] bg-white px-2.5 py-1 rounded border border-[#E8E4DC] self-start sm:self-auto">
                      {monthlyStats.salesByCategory.length} Categories Analyzed
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Items Sold</th>
                          <th>Invoices</th>
                          <th>Revenue (₹)</th>
                          <th>COGS (Cost)</th>
                          <th>Net Profit (₹)</th>
                          <th>Profit Margin</th>
                          <th>Revenue Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyStats.salesByCategory.map((cat, idx) => (
                          <tr key={cat.categoryName || idx}>
                            <td>
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-[#14324B]/5 text-[#14324B] text-xs font-mono font-bold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-[#2B2926] text-xs">{cat.categoryName}</span>
                              </div>
                            </td>
                            <td className="font-mono font-bold text-xs">{cat.itemsSold} pcs</td>
                            <td className="font-mono text-xs text-[#2B2926]/70">{cat.invoicesCount}</td>
                            <td className="font-mono font-bold text-xs text-[#14324B]">₹{cat.revenue.toFixed(2)}</td>
                            <td className="font-mono text-xs text-[#2B2926]/60">₹{cat.cost.toFixed(2)}</td>
                            <td className="font-mono font-bold text-xs text-[#2F9E44]">₹{cat.profit.toFixed(2)}</td>
                            <td>
                              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                                cat.profitMargin >= 30 ? 'bg-[#2F9E44]/10 text-[#2F9E44]' : cat.profitMargin > 0 ? 'bg-[#D98E04]/10 text-[#D98E04]' : 'bg-[#2B2926]/10 text-[#2B2926]/60'
                              }`}>
                                {cat.profitMargin.toFixed(1)}%
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2 min-w-[120px]">
                                <div className="flex-1 h-2 bg-[#FAF9F6] rounded-full overflow-hidden border border-[#E8E4DC]">
                                  <div
                                    className="h-full bg-[#14324B] rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.max(0, cat.percentOfRevenue))}%` }}
                                  ></div>
                                </div>
                                <span className="font-mono text-[11px] font-bold text-[#2B2926]/70 w-10 text-right">
                                  {cat.percentOfRevenue.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── 4 KEY PRODUCT ANALYTICS GRIDS ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. MOST SELLING ITEMS */}
                <div className="retail-card overflow-hidden bg-white">
                  <div className="p-4 border-b border-[#E8E4DC] bg-[#FAF9F6] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-[#2F9E44]/10 text-[#2F9E44] flex items-center justify-center font-bold">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#14324B]">Most Selling Items</h3>
                        <p className="text-[11px] text-[#2B2926]/50">Highest sales volume this month</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#2F9E44] bg-[#2F9E44]/10 px-2 py-0.5 rounded">
                      Top {monthlyStats.mostSellingItems.length}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Product</th>
                          <th>Units Sold</th>
                          <th>Revenue</th>
                          <th>Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyStats.mostSellingItems.length === 0 ? (
                          <tr><td colSpan="5" className="text-center py-6 text-[#2B2926]/50">No sales recorded yet</td></tr>
                        ) : (
                          monthlyStats.mostSellingItems.map((item, idx) => (
                            <tr key={item.productId || idx}>
                              <td className="font-mono font-bold text-xs text-[#2B2926]/40">{idx + 1}</td>
                              <td>
                                <div className="font-bold text-[#2B2926] text-xs">{item.name}</div>
                                <div className="text-[10px] text-[#2B2926]/50">{item.category}</div>
                              </td>
                              <td className="font-mono font-bold text-xs text-[#14324B]">{item.quantitySold} pcs</td>
                              <td className="font-mono text-xs">₹{item.revenueGenerated.toFixed(0)}</td>
                              <td className="font-mono font-bold text-xs text-[#2F9E44]">₹{item.totalProfit.toFixed(0)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. HIGHEST PROFIT ITEMS */}
                <div className="retail-card overflow-hidden bg-white">
                  <div className="p-4 border-b border-[#E8E4DC] bg-[#FAF9F6] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-[#14324B]/10 text-[#14324B] flex items-center justify-center font-bold">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#14324B]">Highest Profit Items</h3>
                        <p className="text-[11px] text-[#2B2926]/50">Generated greatest net profit</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#14324B] bg-[#14324B]/10 px-2 py-0.5 rounded">
                      Top Margin
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Product</th>
                          <th>Sold</th>
                          <th>Total Profit</th>
                          <th>Margin %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyStats.highestProfitItems.length === 0 ? (
                          <tr><td colSpan="5" className="text-center py-6 text-[#2B2926]/50">No profit data available</td></tr>
                        ) : (
                          monthlyStats.highestProfitItems.map((item, idx) => (
                            <tr key={item.productId || idx}>
                              <td className="font-mono font-bold text-xs text-[#2B2926]/40">{idx + 1}</td>
                              <td>
                                <div className="font-bold text-[#2B2926] text-xs">{item.name}</div>
                                <div className="text-[10px] text-[#2B2926]/50">Price: ₹{item.sellingPrice} | Cost: ₹{item.costPrice}</div>
                              </td>
                              <td className="font-mono text-xs">{item.quantitySold}</td>
                              <td className="font-mono font-bold text-xs text-[#2F9E44]">₹{item.totalProfit.toFixed(0)}</td>
                              <td className="font-mono font-bold text-xs text-[#14324B]">{item.profitMargin.toFixed(1)}%</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. LEAST SELLING ITEMS / SLOW MOVERS */}
                <div className="retail-card overflow-hidden bg-white">
                  <div className="p-4 border-b border-[#E8E4DC] bg-[#FAF9F6] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-[#D98E04]/10 text-[#D98E04] flex items-center justify-center font-bold">
                        <ArrowDownRight className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#14324B]">Least Selling Items</h3>
                        <p className="text-[11px] text-[#2B2926]/50">Slow moving inventory this month</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#D98E04] bg-[#D98E04]/10 px-2 py-0.5 rounded">
                      Slow Movers
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Product</th>
                          <th>Stock in Hand</th>
                          <th>Units Sold</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyStats.leastSellingItems.length === 0 ? (
                          <tr><td colSpan="5" className="text-center py-6 text-[#2B2926]/50">No products found</td></tr>
                        ) : (
                          monthlyStats.leastSellingItems.map((item, idx) => (
                            <tr key={item.productId || idx}>
                              <td className="font-mono font-bold text-xs text-[#2B2926]/40">{idx + 1}</td>
                              <td>
                                <div className="font-bold text-[#2B2926] text-xs">{item.name}</div>
                                <div className="text-[10px] text-[#2B2926]/50">{item.category}</div>
                              </td>
                              <td className="font-mono text-xs">{item.currentStock} pcs</td>
                              <td className="font-mono font-bold text-xs text-[#2B2926]">{item.quantitySold} pcs</td>
                              <td>
                                {item.quantitySold === 0 ? (
                                  <span className="status-badge bg-[#D64545]/10 text-[#D64545]">Zero Sales</span>
                                ) : (
                                  <span className="status-badge bg-[#D98E04]/10 text-[#D98E04]">Low Volume</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. LEAST PROFIT ITEMS */}
                <div className="retail-card overflow-hidden bg-white">
                  <div className="p-4 border-b border-[#E8E4DC] bg-[#FAF9F6] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-[#D64545]/10 text-[#D64545] flex items-center justify-center font-bold">
                        <TrendingDown className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#14324B]">Least Profit Items</h3>
                        <p className="text-[11px] text-[#2B2926]/50">Lowest profit contribution or tight margin</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#D64545] bg-[#D64545]/10 px-2 py-0.5 rounded">
                      Low Margin
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Product</th>
                          <th>Sold</th>
                          <th>Total Profit</th>
                          <th>Margin %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyStats.leastProfitItems.length === 0 ? (
                          <tr><td colSpan="5" className="text-center py-6 text-[#2B2926]/50">No sales data available</td></tr>
                        ) : (
                          monthlyStats.leastProfitItems.map((item, idx) => (
                            <tr key={item.productId || idx}>
                              <td className="font-mono font-bold text-xs text-[#2B2926]/40">{idx + 1}</td>
                              <td>
                                <div className="font-bold text-[#2B2926] text-xs">{item.name}</div>
                                <div className="text-[10px] text-[#2B2926]/50">Selling: ₹{item.sellingPrice} | Cost: ₹{item.costPrice}</div>
                              </td>
                              <td className="font-mono text-xs">{item.quantitySold}</td>
                              <td className="font-mono font-bold text-xs text-[#2B2926]">₹{item.totalProfit.toFixed(0)}</td>
                              <td className="font-mono text-xs text-[#D64545] font-bold">{item.profitMargin.toFixed(1)}%</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: SALES ANALYTICS */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="retail-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
              <select
                value={salesOutlet}
                onChange={e => setSalesOutlet(e.target.value)}
                className="form-input text-xs w-36"
              >
                <option value="All">All Outlets</option>
                <option value="Outlet 1">Outlet 1</option>
                <option value="Outlet 2">Outlet 2</option>
              </select>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input text-xs w-36" />
              <span className="text-xs text-[#2B2926]/40">to</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-input text-xs w-36" />
            </div>
            <button onClick={fetchSalesAnalytics} className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${salesLoading ? 'animate-spin' : ''}`} />
              <span>Filter</span>
            </button>
          </div>

          {salesLoading ? (
            <div className="py-12 text-center text-[#2B2926]/50">Loading Sales Analytics...</div>
          ) : salesAnalytics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="receipt-card p-5">
                <div className="text-xs font-semibold text-[#2B2926]/60 uppercase tracking-wider">Revenue</div>
                <div className="receipt-divider"></div>
                <div className="text-3xl font-bold text-[#14324B] font-mono">₹{salesAnalytics.totalRevenue.toFixed(2)}</div>
                <div className="mt-2 text-xs text-[#2B2926]/60">{salesAnalytics.totalInvoices} total invoices</div>
              </div>

              <div className="receipt-card p-5">
                <div className="text-xs font-semibold text-[#2B2926]/60 uppercase tracking-wider">COGS (Cost)</div>
                <div className="receipt-divider"></div>
                <div className="text-3xl font-bold font-mono">₹{salesAnalytics.totalCost.toFixed(2)}</div>
              </div>

              <div className="receipt-card p-5 border-[#2F9E44]/30 bg-[#2F9E44]/5">
                <div className="text-xs font-bold text-[#2F9E44] uppercase tracking-wider">Net Profit</div>
                <div className="border-t-2 border-dashed border-[#2F9E44]/30 my-4"></div>
                <div className="text-3xl font-bold text-[#2F9E44] font-mono">₹{salesAnalytics.netProfit.toFixed(2)}</div>
              </div>

              <div className="receipt-card p-5">
                <div className="text-xs font-semibold text-[#2B2926]/60 uppercase tracking-wider">Payment Channels</div>
                <div className="receipt-divider"></div>
                <div className="text-xs font-mono space-y-1">
                  <div>💵 Cash: <strong className="text-[#2F9E44]">₹{(salesAnalytics.cashRevenue || 0).toFixed(2)}</strong></div>
                  <div>📱 Online: <strong className="text-[#14324B]">₹{(salesAnalytics.onlineRevenue || 0).toFixed(2)}</strong></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: INVENTORY VALUATION */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {inventoryLoading ? (
            <div className="py-12 text-center text-[#2B2926]/50">Loading Inventory Valuation...</div>
          ) : inventoryValuation && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="receipt-card p-5">
                  <div className="text-xs font-semibold text-[#2B2926]/60 uppercase tracking-wider">Total Stock Units</div>
                  <div className="receipt-divider"></div>
                  <div className="text-3xl font-bold text-[#14324B] font-mono">{inventoryValuation.totalStockUnits}</div>
                  <div className="mt-2 text-xs text-[#2B2926]/60">{inventoryValuation.totalProductsCount} distinct products</div>
                </div>

                <div className="receipt-card p-5">
                  <div className="text-xs font-semibold text-[#2B2926]/60 uppercase tracking-wider">Asset Value (Cost)</div>
                  <div className="receipt-divider"></div>
                  <div className="text-3xl font-bold font-mono">₹{inventoryValuation.totalValueAtCost.toFixed(2)}</div>
                </div>

                <div className="receipt-card p-5">
                  <div className="text-xs font-semibold text-[#2B2926]/60 uppercase tracking-wider">Retail Value</div>
                  <div className="receipt-divider"></div>
                  <div className="text-3xl font-bold text-[#2F9E44] font-mono">₹{inventoryValuation.totalValueAtSellingPrice.toFixed(2)}</div>
                </div>

                <div className="receipt-card p-5 border-[#14324B]/30 bg-[#14324B]/5">
                  <div className="text-xs font-bold text-[#14324B] uppercase tracking-wider">Expected Profit Margin</div>
                  <div className="border-t-2 border-dashed border-[#14324B]/30 my-4"></div>
                  <div className="text-3xl font-bold text-[#14324B] font-mono">₹{inventoryValuation.totalPotentialProfit.toFixed(2)}</div>
                </div>
              </div>

              {/* Category Breakdown Table */}
              <div className="retail-card overflow-hidden bg-white">
                <div className="p-4 border-b border-[#E8E4DC] bg-[#FAF9F6]">
                  <h3 className="font-bold text-sm text-[#14324B]">Valuation by Category</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Items Count</th>
                        <th>Stock Units</th>
                        <th>Value at Cost</th>
                        <th>Value at Retail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryValuation.categoryBreakdown.map((cat, i) => (
                        <tr key={i}>
                          <td className="font-bold text-[#2B2926] text-xs">{cat.categoryName}</td>
                          <td className="text-xs">{cat.itemCount} items</td>
                          <td className="font-mono text-xs font-bold">{cat.totalStock}</td>
                          <td className="font-mono text-xs">₹{cat.valueAtCost.toFixed(2)}</td>
                          <td className="font-mono text-xs font-bold text-[#14324B]">₹{cat.valueAtSelling.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
