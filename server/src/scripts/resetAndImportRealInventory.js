const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Product = require('../models/Product');
const Category = require('../models/Category');
const Sale = require('../models/Sale');
const StockTransaction = require('../models/StockTransaction');
const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const SupplierPayment = require('../models/SupplierPayment');
const User = require('../models/User');

function parseCSV(content) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentToken = '';

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentToken.trim());
      currentToken = '';
      if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
        lines.push(row);
      }
      row = [];
    } else {
      currentToken += char;
    }
  }

  if (currentToken !== '' || row.length > 0) {
    row.push(currentToken.trim());
    if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
      lines.push(row);
    }
  }

  return lines;
}

async function runResetAndImport() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is missing from environment variables.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB successfully.\n');

  // STEP 3: BACKUP BEFORE DELETING ANYTHING
  console.log('====================================================');
  console.log('STEP 3: Performing Safety Backup of Current Collections');
  console.log('====================================================');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, `../../backups/backup-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const collectionsToBackup = [
    { name: 'products', model: Product },
    { name: 'sales', model: Sale },
    { name: 'stocktransactions', model: StockTransaction },
    { name: 'purchases', model: Purchase },
    { name: 'suppliers', model: Supplier },
    { name: 'supplierpayments', model: SupplierPayment }
  ];

  const backupResults = [];

  for (const item of collectionsToBackup) {
    const docs = await item.model.find({}).lean();
    const filePath = path.join(backupDir, `${item.name}.json`);
    const jsonContent = JSON.stringify(docs, null, 2);
    fs.writeFileSync(filePath, jsonContent, 'utf8');
    const stats = fs.statSync(filePath);
    backupResults.push({
      collection: item.name,
      count: docs.length,
      fileSizeKb: (stats.size / 1024).toFixed(2),
      filePath
    });
    console.log(`- Backed up '${item.name}': ${docs.length} documents (${(stats.size / 1024).toFixed(2)} KB) -> ${filePath}`);
  }

  console.log(`\nBackup successfully written to: ${backupDir}\n`);

  // STEP 4: WIPE TEST DATA
  console.log('====================================================');
  console.log('STEP 4: Wiping Test Data from Target Collections');
  console.log('====================================================');

  for (const item of collectionsToBackup) {
    const deleteResult = await item.model.deleteMany({});
    console.log(`- Cleared collection '${item.name}': ${deleteResult.deletedCount} documents deleted`);
  }
  console.log('(Users and Categories collections left untouched)\n');

  // STEP 5: RESOLVE CATEGORIES
  console.log('====================================================');
  console.log('STEP 5: Resolving Categories');
  console.log('====================================================');

  const requiredCategories = ['Cosmetics', 'Toys', 'Puja Samagri', 'Stationary'];
  const categoryMap = new Map();

  for (const catName of requiredCategories) {
    let cat = await Category.findOne({ name: { $regex: new RegExp(`^${catName}$`, 'i') } });
    if (!cat) {
      cat = await Category.create({
        name: catName,
        description: `${catName} Department`,
        isActive: true
      });
      console.log(`- Created new category: '${cat.name}' (${cat._id})`);
    } else {
      console.log(`- Found existing category: '${cat.name}' (${cat._id})`);
    }
    categoryMap.set(catName.toLowerCase(), cat._id);
  }

  // Get an owner/admin user for StockTransaction.performedBy
  let adminUser = await User.findOne({ role: 'owner' });
  if (!adminUser) {
    adminUser = await User.findOne({});
  }
  if (!adminUser) {
    console.log('Warning: No user found. Creating a temporary system admin for audit records.');
    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@anjali.local',
      password: 'InitialPassword123!',
      role: 'owner',
      phone: '9999999999'
    });
  }
  console.log(`Audit user for stock history: ${adminUser.name} (${adminUser._id})\n`);

  // STEP 6: IMPORT PRODUCTS FROM CSV
  console.log('====================================================');
  console.log('STEP 6: Importing Real Products from CSV');
  console.log('====================================================');

  let csvFilePath = path.join(__dirname, 'data/products_import.csv');
  if (!fs.existsSync(csvFilePath)) {
    csvFilePath = path.join(__dirname, '../../scripts/data/products_import.csv');
  }

  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`CSV file not found at ${csvFilePath}`);
  }

  const rawCsv = fs.readFileSync(csvFilePath, 'utf8');
  const rows = parseCSV(rawCsv);

  if (rows.length < 2) {
    throw new Error('CSV file has no data rows.');
  }

  const header = rows[0].map(h => h.trim().toLowerCase());
  console.log('CSV Header:', rows[0].join(' | '));

  const nameIdx = header.indexOf('name');
  const catIdx = header.indexOf('category');
  const subCatIdx = header.indexOf('subcategory');
  const costIdx = header.indexOf('costprice');
  const sellIdx = header.indexOf('sellingprice');
  const stockIdx = header.indexOf('currentstock');
  const lowStockIdx = header.indexOf('lowstockthreshold');

  const productsToInsert = [];
  let blankCostPriceCount = 0;
  let blankSellingPriceCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;

    const rawName = row[nameIdx] ? row[nameIdx].trim() : '';
    if (!rawName) continue;

    const rawCategory = row[catIdx] ? row[catIdx].trim() : '';
    const rawSubCategory = subCatIdx !== -1 && row[subCatIdx] ? row[subCatIdx].trim() : '';
    const rawCostPrice = costIdx !== -1 && row[costIdx] !== undefined ? row[costIdx].trim() : '';
    const rawSellingPrice = sellIdx !== -1 && row[sellIdx] !== undefined ? row[sellIdx].trim() : '';
    const rawStock = stockIdx !== -1 && row[stockIdx] !== undefined ? row[stockIdx].trim() : '0';
    const rawLowStock = lowStockIdx !== -1 && row[lowStockIdx] !== undefined ? row[lowStockIdx].trim() : '';

    const categoryId = categoryMap.get(rawCategory.toLowerCase());
    if (!categoryId) {
      console.warn(`Row ${i}: Category '${rawCategory}' not found in resolved map. Skipping.`);
      continue;
    }

    const subCategory = rawSubCategory ? rawSubCategory : null;

    let costPrice = undefined;
    if (rawCostPrice !== '' && !isNaN(parseFloat(rawCostPrice))) {
      costPrice = parseFloat(rawCostPrice);
    } else {
      blankCostPriceCount++;
    }

    let sellingPrice = undefined;
    if (rawSellingPrice !== '' && !isNaN(parseFloat(rawSellingPrice))) {
      sellingPrice = parseFloat(rawSellingPrice);
    } else {
      blankSellingPriceCount++;
    }

    const currentStock = !isNaN(parseInt(rawStock, 10)) ? parseInt(rawStock, 10) : 0;
    const lowStockThreshold = (rawLowStock !== '' && !isNaN(parseInt(rawLowStock, 10))) ? parseInt(rawLowStock, 10) : 5;

    productsToInsert.push({
      name: rawName,
      category: categoryId,
      subCategory,
      unit: 'pcs',
      costPrice,
      sellingPrice,
      currentStock,
      lowStockThreshold,
      isActive: true
    });
  }

  console.log(`Parsed ${productsToInsert.length} products to insert.`);
  const insertedProducts = await Product.insertMany(productsToInsert);
  console.log(`Successfully inserted ${insertedProducts.length} Product documents.\n`);

  // STEP 7: CREATE INITIAL STOCK HISTORY
  console.log('====================================================');
  console.log('STEP 7: Creating Opening Stock Transaction Records');
  console.log('====================================================');

  const stockTransactions = insertedProducts.map(prod => ({
    product: prod._id,
    type: 'ADJUSTMENT_ADD',
    quantityChange: prod.currentStock,
    previousStock: 0,
    newStock: prod.currentStock,
    reason: 'Initial stock — physical count import',
    outlet: 'Outlet 1',
    performedBy: adminUser._id,
    createdAt: new Date()
  }));

  const insertedTransactions = await StockTransaction.insertMany(stockTransactions);
  console.log(`Successfully inserted ${insertedTransactions.length} StockTransaction audit records.\n`);

  // STEP 8: REPORT BACK
  console.log('====================================================');
  console.log('STEP 8: SUMMARY REPORT');
  console.log('====================================================');
  console.log(`1. Categories resolved/active: ${requiredCategories.join(', ')}`);
  console.log(`2. Total Products imported: ${insertedProducts.length}`);
  console.log(`3. Products with BLANK cost price: ${blankCostPriceCount}`);
  console.log(`4. Products with BLANK selling price: ${blankSellingPriceCount}`);
  console.log(`5. StockTransaction records created: ${insertedTransactions.length}`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  console.log('Database disconnected. Process completed successfully.');
}

runResetAndImport().catch(err => {
  console.error('Fatal error during reset and import:', err);
  process.exit(1);
});
