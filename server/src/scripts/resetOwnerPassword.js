require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/retail_inventory');

  const owner = await User.findOne({ role: 'owner' });
  if (!owner) {
    console.log('No owner found — creating one...');
    await User.create({
      name: 'Shop Owner',
      email: 'owner@retail.com',
      password: 'Owner@12345',
      phone: '9876543210',
      role: 'owner',
      isActive: true,
    });
    console.log('Owner created: owner@retail.com / Owner@12345');
  } else {
    console.log('Owner found:', owner.email, '| isActive:', owner.isActive);
    // Directly hash and set password, bypassing pre-save hook
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash('Owner@12345', salt);
    await User.updateOne({ _id: owner._id }, { $set: { password: hashed, isActive: true } });
    console.log('Password reset to: Owner@12345');
  }

  // Verify it works
  const updated = await User.findOne({ role: 'owner' });
  const ok = await bcrypt.compare('Owner@12345', updated.password);
  console.log('Password verification:', ok ? '✅ PASS' : '❌ FAIL');

  await mongoose.disconnect();
}

run().catch(console.error);
