/**
 * exportProductsForStockCount.js
 * -------------------------------------------------------------
 * Exports all active products from MongoDB Atlas to a CSV template
 * for physical stock taking.
 *
 * Columns:
 *   Name, Category, Barcode, Brand, Current Stock (Fill In), Cost Price (Fill In), Selling Price (Fill In)
 *
 * Output:
 *   server/exports/products-for-stock-count.csv
 *
 * Usage:
 *   npm run export:stock-template
 *   or: node src/scripts/exportProductsForStockCount.js
 */

'use strict';

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category'); // Required for population model registration

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/retail_inventory';

function escapeCsvField(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function exportProducts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    console.log('Fetching active products...');
    const products = await Product.find({ isActive: true })
      .populate('category', 'name')
      .lean();

    // Sort by Category name (alphabetical), then Product Name (alphabetical)
    products.sort((a, b) => {
      const catA = (a.category?.name || 'Uncategorized').toLowerCase();
      const catB = (b.category?.name || 'Uncategorized').toLowerCase();
      if (catA !== catB) {
        return catA.localeCompare(catB);
      }
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    const headers = [
      'Name',
      'Category',
      'Barcode',
      'Brand',
      'Current Stock (Fill In)',
      'Cost Price (Fill In)',
      'Selling Price (Fill In)'
    ];

    const rows = products.map((p) => {
      const name = escapeCsvField(p.name || '');
      const category = escapeCsvField(p.category?.name || '');
      const barcode = escapeCsvField(p.barcode || '');
      const brand = escapeCsvField(p.brand || '');
      // Fill In columns left blank intentionally for manual entry
      const currentStock = '';
      const costPrice = '';
      const sellingPrice = '';

      return [name, category, barcode, brand, currentStock, costPrice, sellingPrice].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    const exportDir = path.resolve(__dirname, '../../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filePath = path.join(exportDir, 'products-for-stock-count.csv');
    fs.writeFileSync(filePath, csvContent, 'utf8');

    console.log('\n========================================');
    console.log('  PRODUCT STOCK TEMPLATE EXPORT COMPLETED');
    console.log('========================================');
    console.log(`Total Products Exported: ${products.length}`);
    console.log(`File Saved To:           ${filePath}`);
    console.log('========================================\n');
  } catch (error) {
    console.error('Export failed with error:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
}

exportProducts();
