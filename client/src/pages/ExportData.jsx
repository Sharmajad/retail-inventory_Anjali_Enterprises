import React, { useState } from 'react';
import api from '../services/api';
import {
  Download,
  Calendar,
  CheckSquare,
  Square,
  FileSpreadsheet,
  FileCode,
  Package,
  Receipt,
  Truck,
  Users,
  CreditCard,
  Layers,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

const COLLECTIONS = [
  { id: 'sales', label: 'Sales & Invoices', icon: Receipt, description: 'Transaction history, status (NORMAL / EDITED / VOIDED), item breakdowns and totals', dateBound: true },
  { id: 'products', label: 'Products & Inventory', icon: Package, description: 'Complete current catalog, stock units, barcodes, costs, and selling prices', dateBound: false },
  { id: 'purchases', label: 'Purchases & Restock', icon: Truck, description: 'Supplier purchase orders, restock costs, and payment statuses', dateBound: true },
  { id: 'suppliers', label: 'Suppliers Directory', icon: Users, description: 'Vendor directory, contact info, and current balance ledgers', dateBound: false },
  { id: 'supplier_payments', label: 'Supplier Payments', icon: CreditCard, description: 'Payment records, modes (UPI/Cash/Bank), and reference numbers', dateBound: true },
  { id: 'stock_transactions', label: 'Stock Transactions', icon: Layers, description: 'Complete audit log of additions, sales, adjustments, edits, and void reversals', dateBound: true },
];

export default function ExportData() {
  const [selectedCollections, setSelectedCollections] = useState(['sales', 'products', 'purchases', 'suppliers', 'supplier_payments', 'stock_transactions']);
  const [rangePreset, setRangePreset] = useState('today'); // 'today' | 'this_week' | 'this_month' | 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleToggleCollection = (id) => {
    if (selectedCollections.includes(id)) {
      setSelectedCollections(selectedCollections.filter(c => c !== id));
    } else {
      setSelectedCollections([...selectedCollections, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedCollections(COLLECTIONS.map(c => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedCollections([]);
  };

  const handleDownloadZip = async () => {
    setError('');
    setSuccess('');

    if (selectedCollections.length === 0) {
      setError('Please select at least one collection to export.');
      return;
    }

    if (rangePreset === 'custom' && (!customStart || !customEnd)) {
      setError('Please select both Start Date and End Date for the custom range.');
      return;
    }

    setDownloading(true);

    try {
      const params = {
        collections: selectedCollections.join(','),
        range: rangePreset
      };
      if (rangePreset === 'custom') {
        params.startDate = customStart;
        params.endDate = customEnd;
      }

      const res = await api.get('/export', {
        params,
        responseType: 'blob'
      });

      // Extract filename from header if available, or generate default
      let fileName = `export_${new Date().toISOString().slice(0, 10)}.zip`;
      const disposition = res.headers['content-disposition'];
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) fileName = match[1];
      }

      // Trigger browser download via Blob URL
      const blob = new Blob([res.data], { type: 'application/zip' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccess(`Export package "${fileName}" downloaded successfully!`);
    } catch (err) {
      console.error('Export download error:', err);
      setError(err.response?.data?.message || 'Failed to generate export file. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#2B2926]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14324B] tracking-tight flex items-center gap-2">
            <Download className="w-6 h-6" /> Data Export & Backup
          </h1>
          <p className="text-[#2B2926]/60 text-sm mt-1">
            Generate dual CSV and JSON datasets packaged as a downloadable ZIP archive.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-lg bg-[#2F9E44]/10 border border-[#2F9E44]/30 text-[#2F9E44] text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Date Range Selection Card */}
      <div className="retail-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E4DC] pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#14324B]" />
            <h2 className="font-bold text-sm text-[#14324B]">1. Select Date Range</h2>
          </div>
          <span className="text-[11px] text-[#2B2926]/50">
            Applies to date-bound collections (Sales, Purchases, Stock, Payments)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => setRangePreset('today')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              rangePreset === 'today'
                ? 'bg-[#14324B] text-white border-[#14324B] shadow-xs'
                : 'bg-[#FAF9F6] text-[#2B2926] border-[#E8E4DC] hover:border-[#14324B]'
            }`}
          >
            <div className="font-bold text-xs">Today</div>
            <div className="text-[10px] opacity-75 mt-0.5">Current IST Day</div>
          </button>

          <button
            type="button"
            onClick={() => setRangePreset('this_week')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              rangePreset === 'this_week'
                ? 'bg-[#14324B] text-white border-[#14324B] shadow-xs'
                : 'bg-[#FAF9F6] text-[#2B2926] border-[#E8E4DC] hover:border-[#14324B]'
            }`}
          >
            <div className="font-bold text-xs">This Week</div>
            <div className="text-[10px] opacity-75 mt-0.5">Monday to Date</div>
          </button>

          <button
            type="button"
            onClick={() => setRangePreset('this_month')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              rangePreset === 'this_month'
                ? 'bg-[#14324B] text-white border-[#14324B] shadow-xs'
                : 'bg-[#FAF9F6] text-[#2B2926] border-[#E8E4DC] hover:border-[#14324B]'
            }`}
          >
            <div className="font-bold text-xs">This Month</div>
            <div className="text-[10px] opacity-75 mt-0.5">Current Calendar Month</div>
          </button>

          <button
            type="button"
            onClick={() => setRangePreset('custom')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              rangePreset === 'custom'
                ? 'bg-[#14324B] text-white border-[#14324B] shadow-xs'
                : 'bg-[#FAF9F6] text-[#2B2926] border-[#E8E4DC] hover:border-[#14324B]'
            }`}
          >
            <div className="font-bold text-xs">Custom Range</div>
            <div className="text-[10px] opacity-75 mt-0.5">Pick Start & End Dates</div>
          </button>
        </div>

        {rangePreset === 'custom' && (
          <div className="p-4 rounded-lg bg-[#FAF9F6] border border-[#E8E4DC] flex flex-col sm:flex-row items-center gap-3 animate-fade-in">
            <div className="w-full sm:w-auto flex items-center gap-2">
              <span className="text-xs font-semibold text-[#14324B] whitespace-nowrap">From:</span>
              <input
                type="date"
                required
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div className="w-full sm:w-auto flex items-center gap-2">
              <span className="text-xs font-semibold text-[#14324B] whitespace-nowrap">To:</span>
              <input
                type="date"
                required
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>
        )}

        <div className="text-[11px] text-[#2B2926]/60 bg-[#FAF9F6] p-2.5 rounded border border-[#E8E4DC] flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#14324B] shrink-0" />
          <span>
            <strong>Note:</strong> <strong>Products</strong> and <strong>Suppliers</strong> are always exported as full current-state snapshots regardless of the selected date range.
          </span>
        </div>
      </div>

      {/* Collections Selection Card */}
      <div className="retail-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E4DC] pb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-[#14324B]" />
            <h2 className="font-bold text-sm text-[#14324B]">2. Choose Collections to Include</h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[#14324B] hover:underline font-semibold cursor-pointer"
            >
              Select All
            </button>
            <span className="text-[#2B2926]/30">|</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-[#2B2926]/60 hover:underline cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {COLLECTIONS.map(col => {
            const isSelected = selectedCollections.includes(col.id);
            const Icon = col.icon;
            return (
              <div
                key={col.id}
                onClick={() => handleToggleCollection(col.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  isSelected
                    ? 'bg-white border-[#14324B] shadow-2xs ring-1 ring-[#14324B]'
                    : 'bg-[#FAF9F6]/60 border-[#E8E4DC] opacity-75 hover:opacity-100 hover:border-[#14324B]/50'
                }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-[#14324B] text-white' : 'border border-[#2B2926]/30 text-transparent'
                }`}>
                  {isSelected && <CheckSquare className="w-3.5 h-3.5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#14324B]" />
                    <span className="text-xs font-bold text-[#14324B]">{col.label}</span>
                    <span className="ml-auto text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#FAF9F6] border border-[#E8E4DC] text-[#2B2926]/70">
                      .CSV + .JSON
                    </span>
                  </div>
                  <p className="text-[11px] text-[#2B2926]/65 mt-1 leading-snug">
                    {col.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Action Card */}
      <div className="retail-card p-5 bg-[#FAF9F6] border border-[#E8E4DC] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-xs font-bold text-[#14324B] flex items-center gap-1.5 justify-center sm:justify-start">
            <FileSpreadsheet className="w-4 h-4 text-[#2F9E44]" />
            <FileCode className="w-4 h-4 text-[#14324B]" />
            <span>Dual Format Archive Output</span>
          </div>
          <p className="text-[11px] text-[#2B2926]/60">
            Selected: <strong>{selectedCollections.length}</strong> of {COLLECTIONS.length} collections (generates {selectedCollections.length * 2} files in total inside 1 ZIP)
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={downloading || selectedCollections.length === 0}
          className="btn-primary py-3 px-6 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
        >
          {downloading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Packaging & Downloading...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export & Download (.ZIP)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
