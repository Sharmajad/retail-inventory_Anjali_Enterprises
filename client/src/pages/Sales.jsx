import React, { useState, useEffect } from 'react';
import api from '../services/api';
import SaleDetailModal from '../components/SaleDetailModal';
import { Receipt, Search, Calendar, Eye, RefreshCw, AlertOctagon, Edit3 } from 'lucide-react';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [outletFilter, setOutletFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
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
      if (statusFilter && statusFilter !== 'All') params.status = statusFilter;
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
  }, [searchQuery, outletFilter, statusFilter, startDate, endDate]);

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
          <p className="text-[#2B2926]/60 text-sm mt-1">View past transactions, edit/void audit history, and reprint invoices.</p>
        </div>
      </div>

      <div className="retail-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search Invoice Number..."
            className="form-input pl-10"
          />
          <Search className="w-4 h-4 text-[#2B2926]/40 absolute left-3.5 top-3.5" />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <select
            value={outletFilter}
            onChange={e => setOutletFilter(e.target.value)}
            className="form-input text-xs w-40 font-semibold"
          >
            <option value="All">All Outlets</option>
            <option value="Outlet 1">Stationary Outlet</option>
            <option value="Outlet 2">Outlet 2</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="form-input text-xs w-36 font-semibold"
          >
            <option value="All">All Statuses</option>
            <option value="NORMAL">Normal Sales</option>
            <option value="EDITED">Edited Sales</option>
            <option value="VOIDED">Voided Sales</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="form-input text-xs w-36"
          />
          <span className="text-[#2B2926]/40 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="form-input text-xs w-36"
          />

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
                <th>Status</th>
                <th>Outlet</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Grand Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center py-8 text-[#2B2926]/50">Loading...</td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-[#2B2926]/50">No sales found.</td></tr>
              ) : (
                sales.map((sale) => {
                  const isVoided = sale.status === 'VOIDED';
                  const isEdited = sale.status === 'EDITED';

                  return (
                    <tr
                      key={sale._id}
                      className={isVoided ? 'bg-[#D64545]/5 opacity-75' : ''}
                    >
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
                        {isVoided ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D64545]/15 text-[#D64545] border border-[#D64545]/30 inline-flex items-center gap-1">
                            <AlertOctagon className="w-3 h-3" /> VOIDED
                          </span>
                        ) : isEdited ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#D97706] border border-[#F59E0B]/30 inline-flex items-center gap-1">
                            <Edit3 className="w-3 h-3" /> EDITED
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FAF9F6] text-[#2B2926]/60 border border-[#E8E4DC]">
                            NORMAL
                          </span>
                        )}
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
                      <td className={`font-bold font-mono ${isVoided ? 'line-through text-[#2B2926]/40' : 'text-[#14324B]'}`}>
                        ₹{sale.grandTotal.toFixed(2)}
                      </td>
                      <td>
                        <button
                          onClick={() => handleViewInvoice(sale)}
                          className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1 cursor-pointer font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SaleDetailModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        sale={selectedInvoice}
        onRefresh={fetchSales}
      />
    </div>
  );
}
