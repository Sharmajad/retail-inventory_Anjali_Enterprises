const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Product = require('../models/Product');
const Category = require('../models/Category');
const Sale = require('../models/Sale');
const StockTransaction = require('../models/StockTransaction');
const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const SupplierPayment = require('../models/SupplierPayment');
const User = require('../models/User');

async function verify() {
  await mongoose.connect(process.env.MONGO_URI);

  const productCount = await Product.countDocuments();
  const blankCost = await Product.countDocuments({ $or: [{ costPrice: { $exists: false } }, { costPrice: null }] });
  const blankSell = await Product.countDocuments({ $or: [{ sellingPrice: { $exists: false } }, { sellingPrice: null }] });
  const subCatCount = await Product.countDocuments({ subCategory: { $ne: null } });
  const txCount = await StockTransaction.countDocuments();
  const salesCount = await Sale.countDocuments();
  const purchaseCount = await Purchase.countDocuments();
  const supplierCount = await Supplier.countDocuments();
  const paymentCount = await SupplierPayment.countDocuments();
  const categoryCount = await Category.countDocuments();
  const userCount = await User.countDocuments();

  console.log('--- VERIFICATION COUNTS ---');
  console.log(`Products: ${productCount}`);
  console.log(`Blank Cost Price: ${blankCost}`);
  console.log(`Blank Selling Price: ${blankSell}`);
  console.log(`Products with SubCategory: ${subCatCount}`);
  console.log(`Stock Transactions: ${txCount}`);
  console.log(`Sales: ${salesCount}`);
  console.log(`Purchases: ${purchaseCount}`);
  console.log(`Suppliers: ${supplierCount}`);
  console.log(`Supplier Payments: ${paymentCount}`);
  console.log(`Categories: ${categoryCount}`);
  console.log(`Users: ${userCount}`);

  // Print sample unpriced products
  const unpriced = await Product.find({ $or: [{ sellingPrice: { $exists: false } }, { sellingPrice: null }] }).select('name category subCategory sellingPrice currentStock').populate('category', 'name');
  console.log('\nSample Unpriced Products (12 items):');
  unpriced.forEach((p, idx) => console.log(`${idx + 1}. [${p.category?.name}] ${p.name} (Sub: ${p.subCategory || 'none'}, Stock: ${p.currentStock})`));

  await mongoose.disconnect();
}

verify().catch(console.error);
