/**
 * bulkUpdateStockAndPrices.js
 * -------------------------------------------------------------
 * Bulk updates product stock, cost price, and selling price from a CSV file
 * (such as after a physical stock count).
 *
 * Expected CSV columns:
 *   Name, Category, Barcode, Brand, Current Stock (Fill In), Cost Price (Fill In), Selling Price (Fill In)
 *
 * Matching logic:
 *   1. Matches by Barcode if present and non-empty
 *   2. Otherwise matches by exact Name + Category
 *
 * Auditing:
 *   Creates a StockTransaction record for each stock update:
 *   - type: ADJUSTMENT_ADD (if new > prev) or ADJUSTMENT_SUBTRACT (if new < prev)
 *   - reason: 'Initial physical stock count'
 *
 * Usage:
 *   npm run import:stock-update
 *   or: node src/scripts/bulkUpdateStockAndPrices.js [path/to/file.csv]
 */

'use strict';

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const StockTransaction = require('../models/StockTransaction');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/retail_inventory';

/**
 * Standard CSV Parser supporting quotes, escaped quotes, and newlines.
 */
function parseCSV(content) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  return rows;
}

async function bulkUpdate() {
  const defaultPath = path.resolve(__dirname, '../../imports/products-updated.csv');
  const inputArg = process.argv[2];
  const targetFilePath = inputArg ? path.resolve(process.cwd(), inputArg) : defaultPath;

  console.log('========================================');
  console.log('  BULK UPDATE STOCK & PRICES');
  console.log('========================================');
  console.log(`Target CSV File: ${targetFilePath}`);

  if (!fs.existsSync(targetFilePath)) {
    console.error(`\nError: Specified CSV file does not exist at:\n${targetFilePath}`);
    console.log('\nPlease place your updated CSV at server/imports/products-updated.csv');
    console.log('or provide the file path as an argument:');
    console.log('  node src/scripts/bulkUpdateStockAndPrices.js <path-to-csv>\n');
    process.exit(1);
  }

  const logDir = path.resolve(__dirname, '../../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const skippedLogPath = path.join(logDir, 'skipped-products.log');

  try {
    console.log('\nConnecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Find performing user (Owner or first user in system)
    let adminUser = await User.findOne({ role: 'owner', isActive: true });
    if (!adminUser) {
      adminUser = await User.findOne({ isActive: true });
    }
    if (!adminUser) {
      throw new Error('No active user account found to attribute StockTransactions to.');
    }

    const fileContent = fs.readFileSync(targetFilePath, 'utf8');
    const rawRows = parseCSV(fileContent).filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));

    if (rawRows.length <= 1) {
      console.log('CSV file is empty or contains only headers. No updates to perform.');
      return;
    }

    // Map header indices
    const headerRow = rawRows[0].map((h) => h.trim().toLowerCase());
    const getColIndex = (names) => {
      for (const n of names) {
        const idx = headerRow.findIndex((h) => h === n.toLowerCase() || h.includes(n.toLowerCase()));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const idxName = getColIndex(['name']);
    const idxCategory = getColIndex(['category']);
    const idxBarcode = getColIndex(['barcode']);
    const idxStock = getColIndex(['current stock (fill in)', 'current stock', 'stock']);
    const idxCost = getColIndex(['cost price (fill in)', 'cost price', 'cost']);
    const idxSell = getColIndex(['selling price (fill in)', 'selling price', 'selling']);

    if (idxName === -1 || idxCategory === -1) {
      throw new Error('CSV must contain at least "Name" and "Category" header columns.');
    }

    // Cache categories to minimize lookups
    const allCategories = await Category.find({ isActive: true }).lean();
    const categoryMap = new Map();
    allCategories.forEach((c) => categoryMap.set(c.name.trim().toLowerCase(), c._id));

    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalTransactions = 0;
    const skippedRecords = [];

    const dataRows = rawRows.slice(1);

    for (let i = 0; i < dataRows.length; i++) {
      totalProcessed++;
      const row = dataRows[i];
      const rowNum = i + 2; // Accounting for 1-based index + header row

      const name = (row[idxName] || '').trim();
      const categoryName = (row[idxCategory] || '').trim();
      const barcode = idxBarcode !== -1 ? (row[idxBarcode] || '').trim() : '';
      const stockStr = idxStock !== -1 ? (row[idxStock] || '').trim() : '';
      const costStr = idxCost !== -1 ? (row[idxCost] || '').trim() : '';
      const sellStr = idxSell !== -1 ? (row[idxSell] || '').trim() : '';

      if (!name && !barcode) {
        skippedRecords.push({
          row: rowNum,
          name: name || '[Empty]',
          category: categoryName,
          barcode,
          reason: 'Both Name and Barcode are blank'
        });
        continue;
      }

      // Step 1: Match Product
      let product = null;

      if (barcode) {
        product = await Product.findOne({ barcode, isActive: true });
      }

      if (!product && name) {
        const catId = categoryMap.get(categoryName.toLowerCase());
        if (!catId) {
          skippedRecords.push({
            row: rowNum,
            name,
            category: categoryName,
            barcode,
            reason: `Category "${categoryName}" does not exist in database`
          });
          continue;
        }

        product = await Product.findOne({
          name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          category: catId,
          isActive: true
        });
      }

      if (!product) {
        skippedRecords.push({
          row: rowNum,
          name,
          category: categoryName,
          barcode,
          reason: 'No matching active product found in database'
        });
        continue;
      }

      // Step 2: Prepare Updates
      let hasChanges = false;
      const prevStock = product.currentStock;

      // Handle Stock Update
      if (stockStr !== '') {
        const parsedStock = Number(stockStr);
        if (isNaN(parsedStock) || parsedStock < 0) {
          skippedRecords.push({
            row: rowNum,
            name,
            category: categoryName,
            barcode,
            reason: `Invalid stock value: "${stockStr}" (must be a number >= 0)`
          });
          continue;
        }

        const newStock = Math.round(parsedStock);
        if (newStock !== prevStock) {
          const qtyChange = newStock - prevStock;
          const txType = qtyChange > 0 ? 'ADJUSTMENT_ADD' : 'ADJUSTMENT_SUBTRACT';

          await StockTransaction.create({
            product: product._id,
            type: txType,
            quantityChange: qtyChange,
            previousStock: prevStock,
            newStock: newStock,
            reason: 'Initial physical stock count',
            outlet: 'Outlet 1',
            performedBy: adminUser._id
          });

          product.currentStock = newStock;
          hasChanges = true;
          totalTransactions++;
        }
      }

      // Handle Cost Price Update
      if (costStr !== '') {
        const parsedCost = Number(costStr);
        if (!isNaN(parsedCost) && parsedCost >= 0) {
          if (product.costPrice !== parsedCost) {
            product.costPrice = parsedCost;
            hasChanges = true;
          }
        }
      }

      // Handle Selling Price Update
      if (sellStr !== '') {
        const parsedSell = Number(sellStr);
        if (!isNaN(parsedSell) && parsedSell >= 0) {
          if (product.sellingPrice !== parsedSell) {
            product.sellingPrice = parsedSell;
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        await product.save();
        totalUpdated++;
      }
    }

    // Write skipped log file
    const logHeader = `=== SKIPPED PRODUCTS LOG (${new Date().toISOString()}) ===\nTotal Rows Processed: ${totalProcessed}\nTotal Skipped: ${skippedRecords.length}\n------------------------------------------------------------\n`;
    const logLines = skippedRecords.map(
      (s) => `[Row ${s.row}] Name: "${s.name}" | Category: "${s.category}" | Barcode: "${s.barcode}" => REASON: ${s.reason}`
    );
    fs.writeFileSync(skippedLogPath, logHeader + logLines.join('\n') + '\n', 'utf8');

    console.log('\n========================================');
    console.log('       BULK UPDATE SUMMARY REPORT       ');
    console.log('========================================');
    console.log(`Total Rows Processed:        ${totalProcessed}`);
    console.log(`Total Products Updated:      ${totalUpdated}`);
    console.log(`Stock Transactions Created:  ${totalTransactions}`);
    console.log(`Total Rows Skipped:          ${skippedRecords.length}`);
    console.log(`Skipped Products Log:        ${skippedLogPath}`);
    console.log('========================================\n');
  } catch (error) {
    console.error('Bulk update encountered an error:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
}

bulkUpdate();
