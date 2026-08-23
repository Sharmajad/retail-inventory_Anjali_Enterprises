require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

const ALLOWED = ['Toys', 'Gift Items', 'Cosmetics', 'Stationary', 'Puja Samagri'];

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/retail_inventory');

  const allowedCats = await Category.find({ name: { $in: ALLOWED } });
  const allowedIds = allowedCats.map(c => c._id);

  // Remove any legacy products not in the 5 categories
  await Product.deleteMany({ category: { $nin: allowedIds } });

  // Remove any legacy categories
  await Category.deleteMany({ name: { $nin: ALLOWED } });

  console.log('\n--- FINAL CATALOG AUDIT ---');
  let sum = 0;
  for (const name of ALLOWED) {
    const cat = await Category.findOne({ name });
    const count = await Product.countDocuments({ category: cat._id });
    console.log(`${name.padEnd(16)}: ${count} materials`);
    sum += count;
  }
  console.log('---------------------------');
  console.log(`TOTAL MATERIALS : ${sum}\n`);

  await mongoose.disconnect();
}

run().catch(console.error);
