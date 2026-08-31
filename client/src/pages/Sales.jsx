import React, { useState, useEffect } from 'react';
import api from '../services/api';
import SaleDetailModal from '../components/SaleDetailModal';
import { Receipt, Search, Calendar, Eye, RefreshCw } from 'lucide-react';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [outletFilter, setOutletFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (outletFilter && outletFilter !== 'All') params.outlet = outletFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/sales', { params });
      if (res.data.success) setSales(res.data.sales);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [searchQuery, outletFilter, startDate, endDate]);

  const handleViewInvoice = (sale) => {
    setSelectedInvoice(sale);
    setIsInvoiceModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#2B2926]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14324B] tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6" /> Sales History
          </h1>
          <p className="text-[#2B2926]/60 text-sm mt-1">View past transactions, payment breakdown, and reprint invoices.</p>
        </div>
      </div>

      <div className="retail-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full relative">
          <input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search Invoice Number..." className="form-input pl-10" />
          <Search className="w-4 h-4 text-[#2B2926]/40 absolute left-3.5 top-3.5" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <select
            value={outletFilter}
            onChange={e => setOutletFilter(e.target.value)}
            className="form-input text-xs w-44 font-semibold"
          >
            <option value="All">All Outlets</option>
            <option value="Outlet 1">Stationary Outlet</option>
            <option value="Outlet 2">Outlet 2</option>
          </select>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="form-input text-xs w-36" />
          <span className="text-[#2B2926]/40 text-xs">to</span>
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="form-input text-xs w-36" />
          <button onClick={fetchSales} className="btn-secondary p-2.5 cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="retail-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Invoice Number</th>
                <th>Outlet</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Grand Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-[#2B2926]/50">Loading...</td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-[#2B2926]/50">No sales found.</td></tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale._id}>
                    <td>
                      <div className="font-semibold">{new Date(sale.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-[#2B2926]/50">{new Date(sale.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-bold text-[#14324B] bg-[#FAF9F6] px-2 py-1 rounded border border-[#E8E4DC]">
                        {sale.invoiceNumber}
                      </span>
                    </td>
                    <td>
                      <span className="badge-role bg-[#14324B]/10 text-[#14324B] font-semibold text-xs">
                        🏪 {sale.outlet === 'Outlet 1' ? 'Stationary Outlet' : (sale.outlet || 'Stationary Outlet')}
                      </span>
                    </td>
                    <td className="text-sm">{sale.items.length} items</td>
                    <td>
                      <span className={`badge-role ${sale.paymentMethod === 'cash' ? 'bg-[#2F9E44]/10 text-[#2F9E44]' : 'bg-[#14324B]/10 text-[#14324B]'}`}>
                        {sale.paymentMethod.toUpperCase()}
                      </span>
                    </td>
                    <td className="font-bold font-mono text-[#14324B]">₹{sale.grandTotal.toFixed(2)}</td>
                    <td><button onClick={() => handleViewInvoice(sale)} className="btn-secondary py-1 px-2 text-xs flex items-center gap-1 cursor-pointer"><Eye className="w-3 h-3"/> View</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <SaleDetailModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} sale={selectedInvoice} />
    </div>
  );
}
