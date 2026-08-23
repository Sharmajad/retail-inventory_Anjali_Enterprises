/**
 * Dedicated POS Receipt & Purchase Order Printing Utility
 * Opens a clean, isolated print iframe to ensure perfect print output without blank pages.
 */

export function printReceipt(sale) {
  if (!sale) return;

  const dateObj = new Date(sale.createdAt || Date.now());
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const invoiceNumber = sale.invoiceNumber || 'INV-000000';
  const cashierName = sale.cashier?.name || 'Staff';
  const paymentMethod = String(sale.paymentMethod || 'cash').toUpperCase();
  const subtotal = Number(sale.subtotalAmount || 0).toFixed(2);
  const discount = Number(sale.discountAmount || 0).toFixed(2);
  const tax = Number(sale.taxAmount || 0).toFixed(2);
  const grandTotal = Number(sale.grandTotal || 0).toFixed(2);
  const received = Number(sale.receivedAmount || sale.grandTotal || 0).toFixed(2);
  const change = Number(sale.changeAmount || 0).toFixed(2);
  const items = sale.items || [];

  const itemsHtml = items.map((item, index) => {
    const name = item.productName || item.product?.name || `Item ${index + 1}`;
    const qty = item.quantity || 1;
    const price = Number(item.unitPrice || 0).toFixed(2);
    const total = Number(item.subtotal || qty * (item.unitPrice || 0)).toFixed(2);
    return `
      <tr>
        <td style="padding: 4px 0; text-align: left; vertical-align: top;">${name}</td>
        <td style="padding: 4px 0; text-align: center; vertical-align: top;">${qty}</td>
        <td style="padding: 4px 0; text-align: right; vertical-align: top;">${price}</td>
        <td style="padding: 4px 0; text-align: right; vertical-align: top; font-weight: bold;">${total}</td>
      </tr>
    `;
  }).join('');

  const discountHtml = Number(discount) > 0 ? `
    <div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #555;">
      <span>Discount:</span>
      <span>- ₹${discount}</span>
    </div>
  ` : '';

  const taxHtml = Number(tax) > 0 ? `
    <div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #555;">
      <span>Tax:</span>
      <span>+ ₹${tax}</span>
    </div>
  ` : '';

  const changeHtml = Number(change) > 0 ? `
    <div style="display: flex; justify-content: space-between; margin-top: 3px; font-weight: bold;">
      <span>Change:</span>
      <span>₹${change}</span>
    </div>
  ` : '';

  const receiptHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt - ${invoiceNumber}</title>
        <style>
          @page { size: auto; margin: 8mm; }
          body { font-family: 'Courier New', Courier, monospace, sans-serif; font-size: 12px; color: #000; background: #fff; margin: 0; padding: 10px; }
          .receipt-container { max-width: 320px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
          .store-name { font-size: 18px; font-weight: bold; letter-spacing: 2px; margin: 0; }
          .store-sub { font-size: 10px; text-transform: uppercase; margin-top: 2px; color: #444; }
          .meta-info { font-size: 11px; margin: 8px 0; line-height: 1.4; }
          .meta-row { display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 8px 0; }
          th { border-bottom: 1px dashed #000; padding: 4px 0; text-transform: uppercase; font-size: 10px; }
          .totals-section { border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; font-size: 11px; }
          .grand-total { font-size: 14px; font-weight: bold; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 0; margin: 6px 0; display: flex; justify-content: space-between; }
          .footer { text-align: center; margin-top: 15px; padding-top: 8px; border-top: 1px dashed #000; font-size: 10px; color: #333; }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <h1 class="store-name">ANJALI ENTERPRISES</h1>
            <div class="store-sub">Retail Sales Receipt</div>
          </div>
          
          <div class="meta-info">
            <div class="meta-row">
              <span>Invoice: <strong>${invoiceNumber}</strong></span>
              <span>${formattedDate}</span>
            </div>
            <div class="meta-row">
              <span>Billed By: ${cashierName}</span>
              <span>${formattedTime}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: left; width: 45%;">Item</th>
                <th style="text-align: center; width: 15%;">Qty</th>
                <th style="text-align: right; width: 20%;">Price</th>
                <th style="text-align: right; width: 20%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals-section">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>Subtotal:</span>
              <span>₹${subtotal}</span>
            </div>
            ${discountHtml}
            ${taxHtml}
            <div class="grand-total">
              <span>TOTAL:</span>
              <span>₹${grandTotal}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px; color: #444;">
              <span>Paid (${paymentMethod}):</span>
              <span>₹${received}</span>
            </div>
            ${changeHtml}
          </div>

          <div class="footer">
            <div>Thank you for your visit!</div>
            <div style="margin-top: 2px;">Please visit us again</div>
          </div>
        </div>
      </body>
    </html>
  `;

  renderPrintIframe(receiptHtml);
}

export function printPurchaseOrder(purchase) {
  if (!purchase) return;

  const dateObj = new Date(purchase.createdAt || Date.now());
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const poNumber = purchase.purchaseOrderNumber || 'PO-000000';
  const receivedBy = purchase.createdBy?.name || 'Store Owner';
  const totalAmount = Number(purchase.totalAmount || 0).toFixed(2);
  const status = String(purchase.status || 'RECEIVED').toUpperCase();
  const items = purchase.items || [];

  const itemsHtml = items.map((item, index) => {
    const name = item.productName || item.product?.name || `Material ${index + 1}`;
    const qty = item.quantity || 1;
    const unitCost = Number(item.unitCostPrice || 0).toFixed(2);
    const subtotal = Number(item.subtotal || qty * (item.unitCostPrice || 0)).toFixed(2);
    return `
      <tr>
        <td style="padding: 5px 0; text-align: left; vertical-align: top;">${name}</td>
        <td style="padding: 5px 0; text-align: center; vertical-align: top; font-weight: bold;">${qty}</td>
        <td style="padding: 5px 0; text-align: right; vertical-align: top;">₹${unitCost}</td>
        <td style="padding: 5px 0; text-align: right; vertical-align: top; font-weight: bold;">₹${subtotal}</td>
      </tr>
    `;
  }).join('');

  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const poHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Purchase Order - ${poNumber}</title>
        <style>
          @page { size: auto; margin: 10mm; }
          body { font-family: 'Courier New', Courier, monospace, sans-serif; font-size: 12px; color: #000; background: #fff; margin: 0; padding: 10px; }
          .po-container { max-width: 380px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
          .store-name { font-size: 18px; font-weight: bold; letter-spacing: 2px; margin: 0; }
          .store-sub { font-size: 11px; text-transform: uppercase; margin-top: 3px; font-weight: bold; }
          .meta-info { font-size: 11px; margin: 10px 0; line-height: 1.5; background: #f9f9f9; padding: 6px 8px; border: 1px dashed #ccc; }
          .meta-row { display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 12px 0; }
          th { border-bottom: 1px solid #000; border-top: 1px solid #000; padding: 5px 0; text-transform: uppercase; font-size: 10px; }
          .totals-section { border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; font-size: 12px; }
          .grand-total { font-size: 15px; font-weight: bold; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 0; margin: 8px 0; display: flex; justify-content: space-between; }
          .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px dashed #000; font-size: 10px; color: #555; }
        </style>
      </head>
      <body>
        <div class="po-container">
          <div class="header">
            <h1 class="store-name">ANJALI ENTERPRISES</h1>
            <div class="store-sub">Inventory Restock Purchase Order</div>
          </div>
          
          <div class="meta-info">
            <div class="meta-row">
              <span>PO Number: <strong>${poNumber}</strong></span>
              <span>${formattedDate}</span>
            </div>
            <div class="meta-row">
              <span>Received By: ${receivedBy}</span>
              <span>${formattedTime}</span>
            </div>
            <div class="meta-row">
              <span>Status: <strong>${status}</strong></span>
              <span>Items: <strong>${items.length} (${totalQty} units)</strong></span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: left; width: 45%;">Material</th>
                <th style="text-align: center; width: 15%;">Qty</th>
                <th style="text-align: right; width: 20%;">Unit Cost</th>
                <th style="text-align: right; width: 20%;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals-section">
            <div class="grand-total">
              <span>TOTAL RESTOCK VALUE:</span>
              <span>₹${totalAmount}</span>
            </div>
          </div>

          <div class="footer">
            <div>Stock Restock Record &bull; Inventory Verified</div>
            <div style="margin-top: 3px;">Anjali Enterprises</div>
          </div>
        </div>
      </body>
    </html>
  `;

  renderPrintIframe(poHtml);
}

function renderPrintIframe(htmlContent) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
}
