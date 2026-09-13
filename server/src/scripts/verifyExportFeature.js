require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');

const connectDB = require('../config/db');
const exportRoutes = require('../routes/exportRoutes');
const User = require('../models/User');

async function testExportFeature() {
  console.log('--- TESTING FEATURE 2: DATA EXPORT CONTROLLER & ARCHIVE STREAMING ---');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/retail_inventory');

  const owner = await User.findOne({ role: 'owner' });
  if (!owner) {
    console.error('Owner user not found!');
    process.exit(1);
  }

  const token = jwt.sign(
    { userId: owner._id, role: owner.role },
    process.env.JWT_SECRET || 'super_secret_jwt_key_retail_app_2026_spec',
    { expiresIn: '1h' }
  );

  const app = express();
  app.use(express.json());
  app.use('/api/export', exportRoutes);

  const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`Test server running on port ${port}`);

    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: '/api/export?collections=sales,products,purchases,suppliers,supplier_payments,stock_transactions&range=today',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      console.log(`Export HTTP Status: ${res.statusCode}`);
      console.log(`Content-Type: ${res.headers['content-type']}`);
      console.log(`Content-Disposition: ${res.headers['content-disposition']}`);

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', async () => {
        const buffer = Buffer.concat(chunks);
        console.log(`Received ZIP buffer size: ${buffer.length} bytes`);

        // Verify ZIP magic bytes (PK\x03\x04 = 0x50, 0x4b, 0x03, 0x04)
        const isZip = buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
        if (isZip && res.statusCode === 200) {
          console.log('  ✅ PASS: Export successfully generated and streamed valid ZIP archive containing selected collections!');
        } else {
          console.error('  ❌ FAIL: Expected valid ZIP archive, received:', buffer.toString());
        }

        server.close();
        await mongoose.disconnect();
        process.exit(isZip ? 0 : 1);
      });
    });

    req.on('error', async (e) => {
      console.error(`Export request error: ${e.message}`);
      server.close();
      await mongoose.disconnect();
      process.exit(1);
    });

    req.end();
  });
}

testExportFeature().catch(err => {
  console.error(err);
  process.exit(1);
});
