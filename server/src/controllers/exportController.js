const { ZipArchive } = require('archiver');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const SupplierPayment = require('../models/SupplierPayment');
const StockTransaction = require('../models/StockTransaction');
const Category = require('../models/Category'); // needed for population
const { getISTDateRangePreset, getISTDateString } = require('../utils/dateUtils');

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(headers, rows) {
  const headerLine = headers.map(h => escapeCSV(h.label)).join(',');
  const rowLines = rows.map(row => {
    return headers.map(h => escapeCSV(h.getValue(row))).join(',');
  });
  return [headerLine, ...rowLines].join('\r\n');
}

const exportData = async (req, res) => {
  try {
    const {
      collections: rawCollections,
      range = 'today',
      startDate: customStart,
      endDate: customEnd
    } = req.query;

    let selectedCollections = [];
    if (typeof rawCollections === 'string') {
      selectedCollections = rawCollections.split(',').map(s => s.trim().toLowerCase());
    } else if (Array.isArray(rawCollections)) {
      selectedCollections = rawCollections.map(s => String(s).trim().toLowerCase());
    }

    if (selectedCollections.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one collection to export'
      });
    }

    // Determine date range for date-bound collections
    const { startDate, endDate } = getISTDateRangePreset(range, customStart, customEnd);
    const dateQuery = {};
    if (startDate && endDate) {
      dateQuery.createdAt = { $gte: startDate, $lte: endDate };
    }

    const todayIST = getISTDateString(new Date());
    const zipFileName = `export_${todayIST}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);

    const archive = new ZipArchive({ zlib: { level: 9 } });

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: err.message });
      }
    });

    archive.pipe(res);

    // 1. SALES
    if (selectedCollections.includes('sales')) {
      const sales = await Sale.find(dateQuery)
        .populate('cashier', 'name email')
        .populate('voidedBy', 'name email')
        .populate('editHistory.editedBy', 'name email')
        .sort('-createdAt');

      const salesHeaders = [
        { label: 'Invoice Number', getValue: s => s.invoiceNumber },
        { label: 'Date (IST)', getValue: s => getISTDateString(s.createdAt) },
        { label: 'Time (IST)', getValue: s => new Date(new Date(s.createdAt).getTime() + 5.5 * 3600000).toISOString().slice(11, 19) },
        { label: 'Status', getValue: s => s.status || 'NORMAL' },
        { label: 'Outlet', getValue: s => s.outlet },
        { label: 'Cashier', getValue: s => s.cashier?.name || 'Staff' },
        { label: 'Customer Name', getValue: s => s.customerName || '' },
        { label: 'Customer Phone', getValue: s => s.customerPhone || '' },
        { label: 'Items Count', getValue: s => s.items?.length || 0 },
        { label: 'Subtotal (INR)', getValue: s => Number(s.subtotalAmount || 0).toFixed(2) },
        { label: 'Discount (INR)', getValue: s => Number(s.discountAmount || 0).toFixed(2) },
        { label: 'Tax (INR)', getValue: s => Number(s.taxAmount || 0).toFixed(2) },
        { label: 'Grand Total (INR)', getValue: s => Number(s.grandTotal || 0).toFixed(2) },
        { label: 'Payment Method', getValue: s => s.paymentMethod },
        { label: 'Received (INR)', getValue: s => Number(s.receivedAmount || 0).toFixed(2) },
        { label: 'Change (INR)', getValue: s => Number(s.changeAmount || 0).toFixed(2) },
        { label: 'Void Reason', getValue: s => s.voidReason || '' },
        { label: 'Voided By', getValue: s => s.voidedBy?.name || '' },
        { label: 'Voided At (IST)', getValue: s => s.voidedAt ? getISTDateString(s.voidedAt) : '' },
        { label: 'Items Breakdown', getValue: s => (s.items || []).map(i => `${i.productName || 'Item'} (Qty: ${i.quantity}, ₹${i.unitPrice})`).join('; ') },
        { label: 'Edit Count', getValue: s => s.editHistory?.length || 0 }
      ];

      archive.append(toCSV(salesHeaders, sales), { name: 'sales.csv' });
      archive.append(JSON.stringify(sales, null, 2), { name: 'sales.json' });
    }

    // 2. PRODUCTS / INVENTORY (Full snapshot regardless of date range)
    if (selectedCollections.includes('products') || selectedCollections.includes('inventory')) {
      const products = await Product.find()
        .populate('category', 'name')
        .sort('name');

      const productHeaders = [
        { label: 'Barcode', getValue: p => p.barcode || '' },
        { label: 'Name', getValue: p => p.name },
        { label: 'Category', getValue: p => p.category?.name || 'General' },
        { label: 'SubCategory', getValue: p => p.subCategory || '' },
        { label: 'Brand', getValue: p => p.brand || '' },
        { label: 'Unit', getValue: p => p.unit || 'pcs' },
        { label: 'Cost Price (INR)', getValue: p => p.costPrice !== undefined ? Number(p.costPrice).toFixed(2) : '' },
        { label: 'Selling Price (INR)', getValue: p => p.sellingPrice !== undefined ? Number(p.sellingPrice).toFixed(2) : '' },
        { label: 'Current Stock', getValue: p => p.currentStock || 0 },
        { label: 'Low Stock Threshold', getValue: p => p.lowStockThreshold || 5 },
        { label: 'Is Active', getValue: p => p.isActive ? 'YES' : 'NO' },
        { label: 'Created At (IST)', getValue: p => getISTDateString(p.createdAt) }
      ];

      archive.append(toCSV(productHeaders, products), { name: 'products.csv' });
      archive.append(JSON.stringify(products, null, 2), { name: 'products.json' });
    }

    // 3. PURCHASES
    if (selectedCollections.includes('purchases')) {
      const purchases = await Purchase.find(dateQuery)
        .populate('supplier', 'name phone')
        .populate('createdBy', 'name')
        .sort('-createdAt');

      const purchaseHeaders = [
        { label: 'Purchase Order', getValue: p => p.purchaseOrderNumber },
        { label: 'Date (IST)', getValue: p => getISTDateString(p.createdAt) },
        { label: 'Supplier', getValue: p => p.supplier?.name || 'N/A' },
        { label: 'Outlet', getValue: p => p.outlet },
        { label: 'Items Count', getValue: p => p.items?.length || 0 },
        { label: 'Total Amount (INR)', getValue: p => Number(p.totalAmount || 0).toFixed(2) },
        { label: 'Paid Amount (INR)', getValue: p => Number(p.paidAmount || 0).toFixed(2) },
        { label: 'Balance Due (INR)', getValue: p => Number(p.balanceDue || 0).toFixed(2) },
        { label: 'Payment Status', getValue: p => p.paymentStatus },
        { label: 'Status', getValue: p => p.status },
        { label: 'Created By', getValue: p => p.createdBy?.name || 'Staff' },
        { label: 'Items Breakdown', getValue: p => (p.items || []).map(i => `${i.productName || 'Item'} (Qty: ${i.quantity}, ₹${i.unitCostPrice})`).join('; ') }
      ];

      archive.append(toCSV(purchaseHeaders, purchases), { name: 'purchases.csv' });
      archive.append(JSON.stringify(purchases, null, 2), { name: 'purchases.json' });
    }

    // 4. SUPPLIERS (Full snapshot regardless of date range)
    if (selectedCollections.includes('suppliers')) {
      const suppliers = await Supplier.find().sort('name');

      const supplierHeaders = [
        { label: 'Name', getValue: s => s.name },
        { label: 'Contact Person', getValue: s => s.contactPerson || '' },
        { label: 'Phone', getValue: s => s.phone || '' },
        { label: 'Email', getValue: s => s.email || '' },
        { label: 'Address', getValue: s => s.address || '' },
        { label: 'Current Balance (INR)', getValue: s => Number(s.currentBalance || 0).toFixed(2) },
        { label: 'Is Active', getValue: s => s.isActive ? 'YES' : 'NO' },
        { label: 'Created At (IST)', getValue: s => getISTDateString(s.createdAt) }
      ];

      archive.append(toCSV(supplierHeaders, suppliers), { name: 'suppliers.csv' });
      archive.append(JSON.stringify(suppliers, null, 2), { name: 'suppliers.json' });
    }

    // 5. SUPPLIER PAYMENTS
    if (selectedCollections.includes('supplier_payments') || selectedCollections.includes('payments')) {
      const payments = await SupplierPayment.find(dateQuery)
        .populate('supplier', 'name')
        .populate('recordedBy', 'name')
        .sort('-createdAt');

      const paymentHeaders = [
        { label: 'Date (IST)', getValue: p => getISTDateString(p.createdAt) },
        { label: 'Supplier', getValue: p => p.supplier?.name || 'N/A' },
        { label: 'Amount Paid (INR)', getValue: p => Number(p.amountPaid || 0).toFixed(2) },
        { label: 'Payment Mode', getValue: p => p.paymentMode },
        { label: 'Reference Number', getValue: p => p.referenceNumber || '' },
        { label: 'Notes', getValue: p => p.notes || '' },
        { label: 'Recorded By', getValue: p => p.recordedBy?.name || 'Staff' }
      ];

      archive.append(toCSV(paymentHeaders, payments), { name: 'supplier_payments.csv' });
      archive.append(JSON.stringify(payments, null, 2), { name: 'supplier_payments.json' });
    }

    // 6. STOCK TRANSACTIONS
    if (selectedCollections.includes('stock_transactions') || selectedCollections.includes('transactions')) {
      const transactions = await StockTransaction.find(dateQuery)
        .populate('product', 'name barcode')
        .populate('performedBy', 'name')
        .sort('-createdAt');

      const transactionHeaders = [
        { label: 'Date (IST)', getValue: t => getISTDateString(t.createdAt) },
        { label: 'Time (IST)', getValue: t => new Date(new Date(t.createdAt).getTime() + 5.5 * 3600000).toISOString().slice(11, 19) },
        { label: 'Product Name', getValue: t => t.product?.name || 'Deleted Product' },
        { label: 'Barcode', getValue: t => t.product?.barcode || '' },
        { label: 'Type', getValue: t => t.type },
        { label: 'Quantity Change', getValue: t => t.quantityChange },
        { label: 'Previous Stock', getValue: t => t.previousStock },
        { label: 'New Stock', getValue: t => t.newStock },
        { label: 'Outlet', getValue: t => t.outlet },
        { label: 'Reason', getValue: t => t.reason || '' },
        { label: 'Performed By', getValue: t => t.performedBy?.name || 'System' }
      ];

      archive.append(toCSV(transactionHeaders, transactions), { name: 'stock_transactions.csv' });
      archive.append(JSON.stringify(transactions, null, 2), { name: 'stock_transactions.json' });
    }

    await archive.finalize();
  } catch (error) {
    console.error('Export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = { exportData };
