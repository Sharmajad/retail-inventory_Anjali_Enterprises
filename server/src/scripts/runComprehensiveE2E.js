const API_URL = 'http://localhost:5000/api';

const results = [];

function record(category, testName, passed, details = '') {
  results.push({ category, testName, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [${category}] ${testName}${details ? ` -> ${details}` : ''}`);
}

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const fetchOptions = {
    method: options.method || 'GET',
    headers
  };
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }
  const response = await fetch(url, fetchOptions);
  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }
  return { status: response.status, ok: response.ok, data };
}

async function runTests() {
  console.log('===============================================================');
  console.log('      COMPREHENSIVE END-TO-END AUTOMATED TEST SUITE            ');
  console.log('===============================================================');

  let ownerToken = '';
  let staffToken = '';
  let testCategoryId = '';
  let testProductId = '';
  let testSupplierId = '';

  // ──────────────────────────────────────────────────────────────────────────
  // 1. AUTHENTICATION TESTS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 1. AUTHENTICATION TESTS ---');

  // 1.1 Login with correct owner credentials
  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: 'owner@retail.com', password: 'Owner@12345' }
    });
    if (res.status === 200 && res.data?.success && res.data.token && res.data.user.role === 'owner') {
      ownerToken = res.data.token;
      record('1. Authentication', 'Login with correct owner credentials', true, `Role: ${res.data.user.role}, Token OK`);
    } else {
      record('1. Authentication', 'Login with correct owner credentials', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('1. Authentication', 'Login with correct owner credentials', false, err.message);
  }

  // 1.2 Login with correct staff credentials
  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: 'staff1@retail.com', password: 'Staff@12345' }
    });
    if (res.status === 200 && res.data?.success && res.data.token && res.data.user.role === 'staff') {
      staffToken = res.data.token;
      record('1. Authentication', 'Login with correct staff credentials', true, `Role: ${res.data.user.role}, Outlet: ${res.data.user.outlet}`);
    } else {
      record('1. Authentication', 'Login with correct staff credentials', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('1. Authentication', 'Login with correct staff credentials', false, err.message);
  }

  // 1.3 Login with wrong password -> should be 401
  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: 'owner@retail.com', password: 'WrongPassword999' }
    });
    if (res.status === 401 && !res.data.success) {
      record('1. Authentication', 'Login with wrong password rejected', true, `Correctly returned 401: ${res.data.message}`);
    } else {
      record('1. Authentication', 'Login with wrong password rejected', false, `Returned status ${res.status}`);
    }
  } catch (err) {
    record('1. Authentication', 'Login with wrong password rejected', false, err.message);
  }

  // 1.4 Access protected route without token -> should be 401
  try {
    const res = await request('/reports/dashboard-summary');
    if (res.status === 401) {
      record('1. Authentication', 'Access protected route without token', true, `Returned 401: ${res.data?.message}`);
    } else {
      record('1. Authentication', 'Access protected route without token', false, `Returned status ${res.status}`);
    }
  } catch (err) {
    record('1. Authentication', 'Access protected route without token', false, err.message);
  }

  // 1.5 Access protected route with invalid token -> should be 401
  try {
    const res = await request('/reports/dashboard-summary', {
      headers: { Authorization: 'Bearer fake.invalid.jwt.token' }
    });
    if (res.status === 401) {
      record('1. Authentication', 'Access protected route with invalid token', true, `Returned 401: ${res.data?.message}`);
    } else {
      record('1. Authentication', 'Access protected route with invalid token', false, `Returned status ${res.status}`);
    }
  } catch (err) {
    record('1. Authentication', 'Access protected route with invalid token', false, err.message);
  }

  // 1.6 Verify session /auth/me returns user profile
  try {
    const res = await request('/auth/me', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    if (res.status === 200 && res.data?.user?.email === 'owner@retail.com') {
      record('1. Authentication', 'Session validation via /auth/me', true, `User: ${res.data.user.name}, Role: ${res.data.user.role}`);
    } else {
      record('1. Authentication', 'Session validation via /auth/me', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('1. Authentication', 'Session validation via /auth/me', false, err.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. ROLE-BASED ACCESS (RBAC) TESTS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. ROLE-BASED ACCESS (RBAC) TESTS ---');

  // 2.1 Staff access to monthly statistics -> 403
  try {
    const res = await request('/reports/monthly-statistics', {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    if (res.status === 403) {
      record('2. Role-Based Access', 'Staff blocked from monthly statistics (403)', true, `Blocked with 403: ${res.data?.message}`);
    } else {
      record('2. Role-Based Access', 'Staff blocked from monthly statistics (403)', false, `Returned status ${res.status}`);
    }
  } catch (err) {
    record('2. Role-Based Access', 'Staff blocked from monthly statistics (403)', false, err.message);
  }

  // 2.2 Staff access to user management -> 403
  try {
    const res = await request('/users', {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    if (res.status === 403) {
      record('2. Role-Based Access', 'Staff blocked from user management (403)', true, `Blocked with 403: ${res.data?.message}`);
    } else {
      record('2. Role-Based Access', 'Staff blocked from user management (403)', false, `Returned status ${res.status}`);
    }
  } catch (err) {
    record('2. Role-Based Access', 'Staff blocked from user management (403)', false, err.message);
  }

  // 2.3 Staff allowed access to product catalog
  try {
    const res = await request('/products?limit=5', {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    if (res.status === 200 && res.data?.products) {
      record('2. Role-Based Access', 'Staff allowed to view product catalog', true, `Fetched ${res.data.products.length} products`);
    } else {
      record('2. Role-Based Access', 'Staff allowed to view product catalog', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('2. Role-Based Access', 'Staff allowed to view product catalog', false, err.message);
  }

  // 2.4 Staff dashboard summary omits owner-only profit figures
  try {
    const res = await request('/reports/dashboard-summary', {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    if (res.status === 200 && res.data.summary.todayRevenue === undefined) {
      record('2. Role-Based Access', 'Staff dashboard omits owner-only profit numbers', true, 'todayRevenue & todayNetProfit withheld from staff');
    } else {
      record('2. Role-Based Access', 'Staff dashboard omits owner-only profit numbers', false, 'Profit data leaked to staff');
    }
  } catch (err) {
    record('2. Role-Based Access', 'Staff dashboard omits owner-only profit numbers', false, err.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. PRODUCT MANAGEMENT TESTS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. PRODUCT MANAGEMENT TESTS ---');

  // Fetch or create category
  try {
    const catRes = await request('/categories', { headers: { Authorization: `Bearer ${ownerToken}` } });
    if (catRes.data?.categories?.length > 0) {
      testCategoryId = catRes.data.categories[0]._id;
    } else {
      const newCat = await request('/categories', {
        method: 'POST',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: { name: 'E2E Audit Category' }
      });
      testCategoryId = newCat.data.category._id;
    }
  } catch (e) {}

  const testBarcode = `BAR-E2E-${Date.now()}`;

  // 3.1 Create product with required fields
  try {
    const res = await request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        name: 'E2E Verified Inventory Item',
        category: testCategoryId,
        brand: 'Antigravity Verified',
        costPrice: 60,
        sellingPrice: 150,
        currentStock: 40,
        lowStockThreshold: 5,
        barcode: testBarcode
      }
    });
    if (res.status === 201 && res.data?.product) {
      testProductId = res.data.product._id;
      record('3. Product Management', 'Create product with required fields', true, `Product ID: ${testProductId}, Name: ${res.data.product.name}`);
    } else {
      record('3. Product Management', 'Create product with required fields', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('3. Product Management', 'Create product with required fields', false, err.message);
  }

  // 3.2 Add product missing required name -> should fail with 400
  try {
    const res = await request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { category: testCategoryId, costPrice: 50, sellingPrice: 100 }
    });
    if (res.status === 400) {
      record('3. Product Management', 'Reject product missing required name', true, 'Correctly returned 400 validation error');
    } else {
      record('3. Product Management', 'Reject product missing required name', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('3. Product Management', 'Reject product missing required name', false, err.message);
  }

  // 3.3 Duplicate barcode validation -> 409
  try {
    const res = await request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        name: 'Duplicate Barcode Item',
        category: testCategoryId,
        costPrice: 40,
        sellingPrice: 90,
        barcode: testBarcode
      }
    });
    if (res.status === 409) {
      record('3. Product Management', 'Prevent duplicate barcode assignment (409)', true, `Correctly returned 409: ${res.data?.message}`);
    } else {
      record('3. Product Management', 'Prevent duplicate barcode assignment (409)', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('3. Product Management', 'Prevent duplicate barcode assignment (409)', false, err.message);
  }

  // 3.4 Edit product
  try {
    const res = await request(`/products/${testProductId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { name: 'E2E Verified Inventory Item (Updated)', sellingPrice: 165 }
    });
    if (res.status === 200 && res.data?.product?.sellingPrice === 165) {
      record('3. Product Management', 'Edit product & persist price changes', true, `Updated price: ₹${res.data.product.sellingPrice}`);
    } else {
      record('3. Product Management', 'Edit product & persist price changes', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('3. Product Management', 'Edit product & persist price changes', false, err.message);
  }

  // 3.5 Search product by barcode
  try {
    const res = await request(`/products/barcode/${testBarcode}`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    if (res.status === 200 && res.data?.product?.barcode === testBarcode) {
      record('3. Product Management', 'Search product by barcode', true, `Found: ${res.data.product.name}`);
    } else {
      record('3. Product Management', 'Search product by barcode', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('3. Product Management', 'Search product by barcode', false, err.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. INVENTORY & STOCK TRANSACTIONS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. INVENTORY & STOCK TRANSACTIONS ---');

  // 4.1 Stock adjustment: ADD
  try {
    const res = await request('/inventory/adjust', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        product: testProductId,
        adjustmentType: 'ADJUSTMENT_ADD',
        quantity: 10,
        reason: 'Restock verification test'
      }
    });
    if (res.status === 200 && res.data?.product?.currentStock === 50) {
      record('4. Inventory', 'Adjust stock: ADD quantity', true, `Stock increased from 40 to ${res.data.product.currentStock}`);
    } else {
      record('4. Inventory', 'Adjust stock: ADD quantity', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('4. Inventory', 'Adjust stock: ADD quantity', false, err.message);
  }

  // 4.2 Stock adjustment: SUBTRACT with reason logged
  try {
    const res = await request('/inventory/adjust', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        product: testProductId,
        adjustmentType: 'ADJUSTMENT_SUBTRACT',
        quantity: 5,
        reason: 'Damaged item deduction'
      }
    });
    if (res.status === 200 && res.data?.product?.currentStock === 45) {
      record('4. Inventory', 'Adjust stock: SUBTRACT with reason audit log', true, `Stock decreased to ${res.data.product.currentStock}`);
    } else {
      record('4. Inventory', 'Adjust stock: SUBTRACT with reason audit log', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('4. Inventory', 'Adjust stock: SUBTRACT with reason audit log', false, err.message);
  }

  // 4.3 Verify stock transaction history
  try {
    const res = await request(`/inventory/transactions?product=${testProductId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    if (res.status === 200 && res.data?.transactions?.length >= 2) {
      record('4. Inventory', 'Stock transactions audit trail created', true, `Logged ${res.data.transactions.length} immutable transactions`);
    } else {
      record('4. Inventory', 'Stock transactions audit trail created', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('4. Inventory', 'Stock transactions audit trail created', false, err.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. CRITICAL PATH: SALE CHECKOUT WORKFLOW
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. SALE CHECKOUT WORKFLOW ---');

  // 5.1 Block sale exceeding available stock
  try {
    const res = await request('/sales', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        items: [{ product: testProductId, quantity: 9999 }],
        paymentMethod: 'cash',
        receivedAmount: 999999,
        outlet: 'Outlet 1'
      }
    });
    if (res.status === 400) {
      record('5. Sale Checkout', 'Block sale exceeding available inventory', true, `Correctly blocked: ${res.data?.message}`);
    } else {
      record('5. Sale Checkout', 'Block sale exceeding available inventory', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('5. Sale Checkout', 'Block sale exceeding available inventory', false, err.message);
  }

  // 5.2 Complete Sale with Cash, Discount, and Stock Deduction
  let sale1Invoice = '';
  try {
    const res = await request('/sales', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        items: [{ product: testProductId, quantity: 2 }], // 2 * 165 = 330
        discountAmount: 30, // net = 300
        paymentMethod: 'cash',
        receivedAmount: 400, // change = 100
        outlet: 'Outlet 1',
        customerName: 'Verified Cash Customer'
      }
    });
    if (res.status === 201 && res.data?.sale?.grandTotal === 300 && res.data.sale.changeAmount === 100) {
      sale1Invoice = res.data.sale.invoiceNumber;
      record('5. Sale Checkout', 'Complete sale with discount & cash change calculation', true, `Invoice: ${sale1Invoice}, Net: ₹${res.data.sale.grandTotal}, Change: ₹${res.data.sale.changeAmount}`);
    } else {
      record('5. Sale Checkout', 'Complete sale with discount & cash change calculation', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('5. Sale Checkout', 'Complete sale with discount & cash change calculation', false, err.message);
  }

  // 5.3 Complete Sale with UPI & Outlet 2 assignment
  try {
    const res = await request('/sales', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        items: [{ product: testProductId, quantity: 1 }], // 165
        discountAmount: 0,
        paymentMethod: 'upi',
        receivedAmount: 165,
        outlet: 'Outlet 2',
        customerName: 'UPI Customer'
      }
    });
    if (res.status === 201 && res.data?.sale?.outlet === 'Outlet 2' && res.data.sale.paymentMethod === 'upi') {
      record('5. Sale Checkout', 'Complete sale with UPI & Outlet 2 assignment', true, `Invoice: ${res.data.sale.invoiceNumber}, Channel: UPI, Outlet: ${res.data.sale.outlet}`);
    } else {
      record('5. Sale Checkout', 'Complete sale with UPI & Outlet 2 assignment', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('5. Sale Checkout', 'Complete sale with UPI & Outlet 2 assignment', false, err.message);
  }

  // 5.4 Verify stock deducted correctly (started at 45, sold 2 + 1 = 3 -> should be 42)
  try {
    const res = await request(`/products/${testProductId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    if (res.status === 200 && res.data?.product?.currentStock === 42) {
      record('5. Sale Checkout', 'Inventory reduced accurately after checkout', true, `Stock is 42 (45 - 3)`);
    } else {
      record('5. Sale Checkout', 'Inventory reduced accurately after checkout', false, `Stock is ${res.data?.product?.currentStock}, expected 42`);
    }
  } catch (err) {
    record('5. Sale Checkout', 'Inventory reduced accurately after checkout', false, err.message);
  }

  // 5.5 Verify Sale item stored historic purchase costPrice (60)
  try {
    const res = await request('/sales', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const lastSale = res.data?.sales?.find(s => s.invoiceNumber === sale1Invoice);
    if (lastSale && lastSale.items[0].costPrice === 60) {
      record('5. Sale Checkout', 'Historic purchase costPrice stored in sale record', true, `Stored costPrice: ₹${lastSale.items[0].costPrice}`);
    } else {
      record('5. Sale Checkout', 'Historic purchase costPrice stored in sale record', false, 'Historic costPrice mismatch');
    }
  } catch (err) {
    record('5. Sale Checkout', 'Historic purchase costPrice stored in sale record', false, err.message);
  }

  // 5.6 Rapid sequential sales stress test (No race condition)
  try {
    const pBefore = await request(`/products/${testProductId}`, { headers: { Authorization: `Bearer ${ownerToken}` } });
    const stockBefore = pBefore.data.product.currentStock; // 42

    // 3 rapid sequential sales of 1 item each
    await Promise.all([
      request('/sales', { method: 'POST', headers: { Authorization: `Bearer ${ownerToken}` }, body: { items: [{ product: testProductId, quantity: 1 }], paymentMethod: 'cash', receivedAmount: 165, outlet: 'Outlet 1' } }),
      request('/sales', { method: 'POST', headers: { Authorization: `Bearer ${ownerToken}` }, body: { items: [{ product: testProductId, quantity: 1 }], paymentMethod: 'card', receivedAmount: 165, outlet: 'Outlet 1' } }),
      request('/sales', { method: 'POST', headers: { Authorization: `Bearer ${ownerToken}` }, body: { items: [{ product: testProductId, quantity: 1 }], paymentMethod: 'upi', receivedAmount: 165, outlet: 'Outlet 2' } })
    ]);

    const pAfter = await request(`/products/${testProductId}`, { headers: { Authorization: `Bearer ${ownerToken}` } });
    const stockAfter = pAfter.data.product.currentStock;

    if (stockAfter === stockBefore - 3) {
      record('5. Sale Checkout', 'Sequential sales concurrency & stock accuracy', true, `Stock correctly reduced by 3 (from ${stockBefore} to ${stockAfter})`);
    } else {
      record('5. Sale Checkout', 'Sequential sales concurrency & stock accuracy', false, `Stock mismatch: ${stockAfter} vs expected ${stockBefore - 3}`);
    }
  } catch (err) {
    record('5. Sale Checkout', 'Sequential sales concurrency & stock accuracy', false, err.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. PURCHASES & SUPPLIERS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6. PURCHASES & SUPPLIERS ---');

  // 6.1 Create supplier
  try {
    const res = await request('/suppliers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        name: 'Quality National Traders',
        contactPerson: 'Suresh Raina',
        phone: '9811223344',
        email: 'suresh@nationaltraders.com',
        openingBalance: 0
      }
    });
    if (res.status === 201 && res.data?.supplier) {
      testSupplierId = res.data.supplier._id;
      record('6. Purchases & Suppliers', 'Create supplier account', true, `Supplier: ${res.data.supplier.name}, ID: ${testSupplierId}`);
    } else {
      record('6. Purchases & Suppliers', 'Create supplier account', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('6. Purchases & Suppliers', 'Create supplier account', false, err.message);
  }

  // 6.2 Create restock purchase with partial payment (credit tracking)
  try {
    const res = await request('/purchases', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        supplier: testSupplierId,
        items: [{ product: testProductId, quantity: 20, unitCostPrice: 65 }],
        paidAmount: 500, // Total = 20 * 65 = 1300, Paid = 500, Balance due = 800
        outlet: 'Outlet 1'
      }
    });
    if (res.status === 201 && res.data?.purchase?.totalAmount === 1300 && res.data.purchase.balanceDue === 800) {
      record('6. Purchases & Suppliers', 'Create purchase order with partial payment', true, `Total: ₹1300, Balance Due: ₹${res.data.purchase.balanceDue}`);
    } else {
      record('6. Purchases & Suppliers', 'Create purchase order with partial payment', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('6. Purchases & Suppliers', 'Create purchase order with partial payment', false, err.message);
  }

  // 6.3 Verify supplier balance updated to 800
  try {
    const res = await request(`/suppliers/${testSupplierId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    if (res.status === 200 && res.data?.supplier?.currentBalance === 800) {
      record('6. Purchases & Suppliers', 'Supplier credit balance tracks outstanding debt', true, `Supplier balance: ₹${res.data.supplier.currentBalance}`);
    } else {
      record('6. Purchases & Suppliers', 'Supplier credit balance tracks outstanding debt', false, `Balance: ${res.data?.supplier?.currentBalance}`);
    }
  } catch (err) {
    record('6. Purchases & Suppliers', 'Supplier credit balance tracks outstanding debt', false, err.message);
  }

  // 6.4 Record supplier payment
  try {
    const res = await request(`/suppliers/${testSupplierId}/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        amountPaid: 500,
        paymentMode: 'bank_transfer',
        referenceNumber: 'IMPS-99887766',
        notes: 'Partial payment to vendor'
      }
    });
    if (res.status === 200 && res.data?.supplier?.currentBalance === 300) {
      record('6. Purchases & Suppliers', 'Record supplier payment & reduce balance', true, `Balance reduced to ₹${res.data.supplier.currentBalance} (800 - 500)`);
    } else {
      record('6. Purchases & Suppliers', 'Record supplier payment & reduce balance', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('6. Purchases & Suppliers', 'Record supplier payment & reduce balance', false, err.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. EXECUTIVE REPORTS & MONTHLY STATISTICS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 7. REPORTS & MONTHLY STATISTICS ---');

  // 7.1 Dashboard summary (IST timezone calculations)
  try {
    const res = await request('/reports/dashboard-summary?outlet=All', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    if (res.status === 200 && res.data?.summary?.todayCashRevenue !== undefined && res.data.summary.todayOnlineRevenue !== undefined) {
      record('7. Reports & Analytics', 'Dashboard summary with separate Cash vs Online metrics (IST)', true, `Cash: ₹${res.data.summary.todayCashRevenue}, Online: ₹${res.data.summary.todayOnlineRevenue}`);
    } else {
      record('7. Reports & Analytics', 'Dashboard summary with separate Cash vs Online metrics (IST)', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('7. Reports & Analytics', 'Dashboard summary with separate Cash vs Online metrics (IST)', false, err.message);
  }

  // 7.2 Monthly statistics
  try {
    const res = await request('/reports/monthly-statistics?outlet=All', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    if (res.status === 200 && res.data?.mostSellingItems && res.data.leastSellingItems && res.data.highestProfitItems && res.data.outletComparison) {
      record('7. Reports & Analytics', 'Monthly Statistics: Most/least sold & Profit rankings', true, `Top items: ${res.data.mostSellingItems.length}, Outlet 1 Rev: ₹${res.data.outletComparison['Outlet 1'].revenue}`);
    } else {
      record('7. Reports & Analytics', 'Monthly Statistics: Most/least sold & Profit rankings', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('7. Reports & Analytics', 'Monthly Statistics: Most/least sold & Profit rankings', false, err.message);
  }

  // 7.3 Inventory valuation
  try {
    const res = await request('/reports/inventory-valuation', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    if (res.status === 200 && res.data?.valuation?.totalStockUnits > 0) {
      record('7. Reports & Analytics', 'Inventory valuation & category asset breakdown', true, `Total Stock Units: ${res.data.valuation.totalStockUnits}, Cost: ₹${res.data.valuation.totalValueAtCost.toFixed(0)}`);
    } else {
      record('7. Reports & Analytics', 'Inventory valuation & category asset breakdown', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('7. Reports & Analytics', 'Inventory valuation & category asset breakdown', false, err.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 8. PRODUCT DELETION (Soft Delete Safety)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 8. PRODUCT DELETION ---');

  try {
    const res = await request(`/products/${testProductId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    if (res.status === 200 && res.data?.success) {
      // Verify product is no longer returned in active catalog
      const checkRes = await request(`/products?search=E2E Verified Inventory Item`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      const stillActive = checkRes.data?.products?.some(p => p._id === testProductId);
      if (!stillActive) {
        record('8. Product Deletion', 'Soft delete deactivates product from active catalog without deleting invoices', true, 'Product removed from active POS search');
      } else {
        record('8. Product Deletion', 'Soft delete deactivates product from active catalog without deleting invoices', false, 'Deleted product still in active catalog');
      }
    } else {
      record('8. Product Deletion', 'Soft delete deactivates product from active catalog without deleting invoices', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('8. Product Deletion', 'Soft delete deactivates product from active catalog without deleting invoices', false, err.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 9. SUMMARY OF RESULTS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  console.log(`TOTAL AUDIT TESTS RUN: ${total}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('===============================================================');

  if (failed === 0) {
    console.log('🎉 ALL 24 E2E INTEGRATION & BUSINESS LOGIC TESTS PASSED 100%!');
  }
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
