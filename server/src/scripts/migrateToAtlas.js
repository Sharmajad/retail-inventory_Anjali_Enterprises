require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const LOCAL_URI = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/retail_inventory';
const TARGET_ATLAS_URI = process.argv[2] || process.env.ATLAS_URI || process.env.MONGO_URI;

async function migrate() {
  console.log('====================================================');
  console.log('       RETAIL INVENTORY - MONGODB ATLAS MIGRATOR     ');
  console.log('====================================================');

  if (!TARGET_ATLAS_URI || !TARGET_ATLAS_URI.includes('mongodb')) {
    console.error('\n❌ ERROR: MongoDB Atlas URI not provided!');
    console.log('\nUsage:');
    console.log('  node src/scripts/migrateToAtlas.js "<YOUR_MONGODB_ATLAS_CONNECTION_STRING>"\n');
    console.log('Example:');
    console.log('  node src/scripts/migrateToAtlas.js "mongodb+srv://admin:MyPass123@cluster0.abcde.mongodb.net/retail_inventory?retryWrites=true&w=majority"\n');
    process.exit(1);
  }

  if (TARGET_ATLAS_URI.includes('127.0.0.1') || TARGET_ATLAS_URI.includes('localhost')) {
    console.error('\n❌ ERROR: The provided connection string points to localhost, not MongoDB Atlas.');
    process.exit(1);
  }

  console.log(`\n1️⃣  Connecting to Local MongoDB: ${LOCAL_URI}...`);
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('   ✅ Connected to Local MongoDB.');

  console.log(`\n2️⃣  Connecting to MongoDB Atlas...`);
  const atlasConn = await mongoose.createConnection(TARGET_ATLAS_URI).asPromise();
  console.log(`   ✅ Connected to MongoDB Atlas: ${atlasConn.host}`);

  // Fetch all collections from local
  const collections = await localConn.db.listCollections().toArray();
  console.log(`\n3️⃣  Found ${collections.length} collections in local database.`);

  for (const col of collections) {
    const colName = col.name;
    if (colName.startsWith('system.')) continue;

    console.log(`\n📦 Migrating collection: [${colName}]...`);
    const localCollection = localConn.db.collection(colName);
    const atlasCollection = atlasConn.db.collection(colName);

    const docs = await localCollection.find({}).toArray();
    console.log(`   Found ${docs.length} documents in local [${colName}].`);

    if (docs.length > 0) {
      // Clear target collection before inserting to prevent duplicate keys
      await atlasCollection.deleteMany({});
      const result = await atlasCollection.insertMany(docs);
      console.log(`   ✅ Successfully transferred ${result.insertedCount} documents to Atlas.`);
    } else {
      console.log(`   ℹ️ Collection is empty, skipped.`);
    }

    // Migrate indexes
    try {
      const indexes = await localCollection.indexes();
      for (const idx of indexes) {
        if (idx.name === '_id_') continue;
        const key = idx.key;
        const options = { name: idx.name };
        if (idx.unique) options.unique = true;
        await atlasCollection.createIndex(key, options);
      }
      console.log(`   ✅ Indexes migrated for [${colName}].`);
    } catch (idxErr) {
      console.log(`   ⚠️ Index warning: ${idxErr.message}`);
    }
  }

  console.log('\n====================================================');
  console.log('🎉 ALL DATA HAS BEEN MIGRATED TO MONGODB ATLAS!');
  console.log('====================================================');
  console.log('\nNext Step:');
  console.log('Update your server/.env file with:');
  console.log(`MONGO_URI=${TARGET_ATLAS_URI}\n`);

  await localConn.close();
  await atlasConn.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error('\n❌ Migration failed with error:', err.message);
  process.exit(1);
});
