require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/retail_inventory');

  // Set clean owner password
  const salt1 = await bcrypt.genSalt(10);
  const ownerHash = await bcrypt.hash('Owner@12345', salt1);
  await User.updateOne(
    { email: 'owner@retail.com' },
    { $set: { name: 'Main Shop Owner', password: ownerHash, role: 'owner', outlet: 'All', phone: '9876543210', isActive: true } },
    { upsert: true }
  );

  // Set clean staff 1 password (Outlet 1)
  const salt2 = await bcrypt.genSalt(10);
  const staff1Hash = await bcrypt.hash('Staff@12345', salt2);
  await User.updateOne(
    { email: 'staff1@retail.com' },
    { $set: { name: 'Counter Staff (Outlet 1)', phone: '9876543211', password: staff1Hash, role: 'staff', outlet: 'Outlet 1', isActive: true } },
    { upsert: true }
  );

  // Set clean staff 2 password (Outlet 2)
  const salt3 = await bcrypt.genSalt(10);
  const staff2Hash = await bcrypt.hash('Staff@12345', salt3);
  await User.updateOne(
    { email: 'staff2@retail.com' },
    { $set: { name: 'Counter Staff (Outlet 2)', phone: '9876543212', password: staff2Hash, role: 'staff', outlet: 'Outlet 2', isActive: true } },
    { upsert: true }
  );

  console.log('✅ Accounts successfully prepared:');
  console.log('1. Owner: owner@retail.com / Owner@12345 (role: owner, outlet: All - FULL ACCESS)');
  console.log('2. Staff 1: staff1@retail.com / Staff@12345 (role: staff, outlet: Outlet 1)');
  console.log('3. Staff 2: staff2@retail.com / Staff@12345 (role: staff, outlet: Outlet 2)');

  await mongoose.disconnect();
}

run().catch(console.error);
