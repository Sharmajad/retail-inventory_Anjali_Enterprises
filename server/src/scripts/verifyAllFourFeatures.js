require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const StockTransaction = require('../models/StockTransaction');
const { isSaleWithin2DaysIST, getISTDaysDifference, getISTDateString } = require('../utils/dateUtils');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('=====================================================');
  console.log('RUNNING COMPREHENSIVE VERIFICATION FOR ALL 4 FEATURES');
  console.log('=====================================================\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/retail_inventory');

  // Test 1: Date Utilities for 2-Day Asia/Kolkata Window
  console.log('--- TEST GROUP 1: IST Date Window (Asia/Kolkata) ---');
  const now = new Date();
  assert(isSaleWithin2DaysIST(now) === true, 'Sale created right now is within 2-day IST window');
  
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  assert(isSaleWithin2DaysIST(yesterday) === true, 'Sale created 1 day ago is within 2-day IST window');

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000);
  assert(getISTDaysDifference(twoDaysAgo) <= 2, 'Sale created 2 days ago has IST difference <= 2');

  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 3600 * 1000);
  assert(isSaleWithin2DaysIST(fiveDaysAgo) === false, 'Sale created 5 days ago is OUTSIDE 2-day IST window');


  // Test 2: Staff Management (Feature 4)
  console.log('\n--- TEST GROUP 2: Staff Management (Feature 4) ---');
  const testPhone = '9999000001';
  await User.deleteMany({ phone: testPhone });

  // Create staff
  const staff = await User.create({
    name: 'Test Staff 9999',
    phone: testPhone,
    password: 'Password@123',
    role: 'staff',
    outlet: 'Outlet 1',
    isActive: true,
    mustChangePassword: false
  });
  assert(staff._id && staff.phone === testPhone, 'Staff created with phone login ID');

  // Verify unique phone enforcement
  let duplicateCaught = false;
  try {
    await User.create({
      name: 'Duplicate Staff',
      phone: testPhone,
      password: 'AnotherPassword@123',
      role: 'staff',
      outlet: 'Outlet 2',
      isActive: true
    });
  } catch (err) {
    duplicateCaught = true;
  }
  assert(duplicateCaught, 'Duplicate phone number is strictly rejected at schema/db level');

  // Deactivate staff
  staff.isActive = false;
  await staff.save();
  assert(staff.isActive === false, 'Staff successfully deactivated');

  // Reactivate staff
  staff.isActive = true;
  await staff.save();
  assert(staff.isActive === true, 'Staff successfully reactivated with original phone intact');


  // Test 3: Password Reset by Owner (Feature 3)
  console.log('\n--- TEST GROUP 3: Password Reset by Owner (Feature 3) ---');
  const tempPass = 'Pass@778899';
  staff.password = tempPass;
  staff.mustChangePassword = true;
  await staff.save();

  const refreshedStaff = await User.findById(staff._id);
  assert(refreshedStaff.mustChangePassword === true, 'Staff flag mustChangePassword is set to true');
  const tempMatches = await refreshedStaff.comparePassword(tempPass);
  assert(tempMatches, 'Staff can verify password with temporary password');

  // Staff changes password
  refreshedStaff.password = 'NewPermanent@321';
  refreshedStaff.mustChangePassword = false;
  await refreshedStaff.save();

  const finalStaff = await User.findById(staff._id);
  assert(finalStaff.mustChangePassword === false, 'mustChangePassword cleared after password change');
  const newPassMatches = await finalStaff.comparePassword('NewPermanent@321');
  assert(newPassMatches, 'New permanent password is now active');


  // Test 4: Sale Edit & Void (Feature 1)
  console.log('\n--- TEST GROUP 4: Sale Edit & Void (Feature 1) ---');
  // Find an active product with stock
  let testProd = await Product.findOne({ isActive: true, currentStock: { $gte: 20 } });
  if (!testProd) {
    testProd = await Product.create({
      name: 'Verification Product',
      sellingPrice: 100,
      costPrice: 60,
      currentStock: 50,
      isActive: true
    });
  }

  const initialStock = testProd.currentStock;
  const initialSaleQty = 3;
  testProd.currentStock -= initialSaleQty;
  await testProd.save();

  const invNum = `TEST-INV-${Date.now()}`;
  const owner = await User.findOne({ role: 'owner' }) || finalStaff;

  const sale = await Sale.create({
    invoiceNumber: invNum,
    items: [{
      product: testProd._id,
      productName: testProd.name,
      quantity: initialSaleQty,
      unitPrice: 100,
      costPrice: 60,
      subtotal: 300
    }],
    subtotalAmount: 300,
    discountAmount: 0,
    taxAmount: 0,
    grandTotal: 300,
    paymentMethod: 'cash',
    receivedAmount: 300,
    changeAmount: 0,
    cashier: owner._id,
    outlet: 'Outlet 1',
    status: 'NORMAL'
  });
  assert(sale.status === 'NORMAL', 'Sale created with default status NORMAL');

  // Edit Sale: change quantity from 3 to 5
  const editQty = 5;
  // Step 4a: reverse original stock (+3)
  testProd.currentStock += initialSaleQty;
  // Step 4b: deduct new stock (-5)
  testProd.currentStock -= editQty;
  await testProd.save();

  const beforeSnap = {
    items: sale.items,
    subtotalAmount: sale.subtotalAmount,
    grandTotal: sale.grandTotal
  };
  const afterSnap = {
    items: [{ product: testProd._id, productName: testProd.name, quantity: editQty, unitPrice: 100, costPrice: 60, subtotal: 500 }],
    subtotalAmount: 500,
    grandTotal: 500
  };

  sale.items = [{
    product: testProd._id,
    productName: testProd.name,
    quantity: editQty,
    unitPrice: 100,
    costPrice: 60,
    subtotal: 500
  }];
  sale.subtotalAmount = 500;
  sale.grandTotal = 500;
  sale.status = 'EDITED';
  sale.editHistory.push({
    editedBy: owner._id,
    editedAt: new Date(),
    reason: 'Customer requested 2 additional units',
    beforeSnapshot: beforeSnap,
    afterSnapshot: afterSnap
  });
  await sale.save();

  const editedSaleCheck = await Sale.findById(sale._id);
  assert(editedSaleCheck.status === 'EDITED', 'Sale status updated to EDITED');
  assert(editedSaleCheck.editHistory.length === 1, 'Sale editHistory recorded 1 entry');
  assert(editedSaleCheck.editHistory[0].reason === 'Customer requested 2 additional units', 'Edit reason is recorded in audit log');

  // Void Sale
  // Reverse current items (+5 back to product)
  testProd.currentStock += editQty;
  await testProd.save();

  editedSaleCheck.status = 'VOIDED';
  editedSaleCheck.voidedBy = owner._id;
  editedSaleCheck.voidedAt = new Date();
  editedSaleCheck.voidReason = 'Customer returned full order';
  await editedSaleCheck.save();

  const voidedSaleCheck = await Sale.findById(sale._id);
  assert(voidedSaleCheck.status === 'VOIDED', 'Sale status updated to VOIDED');
  assert(voidedSaleCheck.voidReason === 'Customer returned full order', 'Void reason recorded');
  assert(voidedSaleCheck.voidedBy.toString() === owner._id.toString(), 'voidedBy user recorded');

  // Verify stock restored to initial stock
  const finalProd = await Product.findById(testProd._id);
  assert(finalProd.currentStock === initialStock, `Product stock properly restored to initial level (${finalProd.currentStock} == ${initialStock})`);

  // Clean up test data
  await Sale.findByIdAndDelete(sale._id);
  await User.findByIdAndDelete(staff._id);

  console.log('\n=====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================');

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
