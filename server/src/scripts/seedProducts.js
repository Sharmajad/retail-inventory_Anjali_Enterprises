/**
 * seedProducts.js
 * ---------------
 * Bulk import / sync initial product catalog for 5 categories (290 materials).
 *
 * Categories:
 * - Toys (36)
 * - Gift Items (6)
 * - Cosmetics (60)
 * - Stationary (108)
 * - Puja Samagri (80)
 * Total = 290 materials
 *
 * Usage:
 *   cd server
 *   node src/scripts/seedProducts.js
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product  = require('../models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/retail_inventory';

const CATEGORIES = [
  'Toys',
  'Gift Items',
  'Cosmetics',
  'Stationary',
  'Puja Samagri',
];

const SEED_PRODUCTS = [
  // ===== Toys (36) =====
  { name: 'Small car',        category: 'Toys' },
  { name: 'Medium size car',  category: 'Toys' },
  { name: 'Large size car',   category: 'Toys' },
  { name: 'Small bat',        category: 'Toys' },
  { name: 'Medium bat',       category: 'Toys' },
  { name: 'Large bat',        category: 'Toys' },
  { name: 'Kitchen set',      category: 'Toys' },
  { name: 'Gun',              category: 'Toys' },
  { name: 'Doctor set',       category: 'Toys' },
  { name: 'Ice cream set',    category: 'Toys' },
  { name: 'Fruit set',        category: 'Toys' },
  { name: 'Animal set',       category: 'Toys' },
  { name: 'Cube',             category: 'Toys' },
  { name: 'Motor bike set',   category: 'Toys' },
  { name: 'Motor bike large', category: 'Toys' },
  { name: 'Doll single',      category: 'Toys' },
  { name: 'Doll set',         category: 'Toys' },
  { name: 'Alphabet set',     category: 'Toys' },
  { name: 'Number set',       category: 'Toys' },
  { name: 'Plastic ball',     category: 'Toys' },
  { name: 'Tennis ball',      category: 'Toys' },
  { name: 'Normal ball',      category: 'Toys' },
  { name: 'Duck set',         category: 'Toys' },
  { name: 'Fighter plane',    category: 'Toys' },
  { name: 'Gannu set',        category: 'Toys' },
  { name: 'Jhunjhuna',        category: 'Toys' },
  { name: 'Remote car',       category: 'Toys' },
  { name: 'Train',            category: 'Toys' },
  { name: 'Blocks',           category: 'Toys' },
  { name: 'Remote',           category: 'Toys' },
  { name: 'Water video game', category: 'Toys' },
  { name: 'Super heroes',     category: 'Toys' },
  { name: 'Talking cactus',   category: 'Toys' },
  { name: 'Gyro gun',         category: 'Toys' },
  { name: 'Teddy bear',       category: 'Toys' },
  { name: 'Bubble stick',     category: 'Toys' },

  // ===== Gift Items (6) =====
  { name: 'Dinner set',       category: 'Gift Items' },
  { name: 'Glass set',        category: 'Gift Items' },
  { name: 'Cup set',          category: 'Gift Items' },
  { name: 'Coffee set',       category: 'Gift Items' },
  { name: 'Bowl set',         category: 'Gift Items' },
  { name: 'Cup & plate set',  category: 'Gift Items' },

  // ===== Cosmetics (60) =====
  { name: 'Earing',           category: 'Cosmetics' },
  { name: 'Glass bangles',    category: 'Cosmetics' },
  { name: 'City gold bangles',category: 'Cosmetics' },
  { name: 'Red pola bangles', category: 'Cosmetics' },
  { name: 'Sankha bangles',   category: 'Cosmetics' },
  { name: 'Lipstick',         category: 'Cosmetics' },
  { name: 'Lip balm',         category: 'Cosmetics' },
  { name: 'Face wash',        category: 'Cosmetics' },
  { name: 'Kajal',            category: 'Cosmetics' },
  { name: 'Eyeliner',         category: 'Cosmetics' },
  { name: 'Mascara',          category: 'Cosmetics' },
  { name: 'Bleach',           category: 'Cosmetics' },
  { name: 'Make up kit',      category: 'Cosmetics' },
  { name: 'Powder',           category: 'Cosmetics' },
  { name: 'Perfume',          category: 'Cosmetics' },
  { name: 'Room freshener',   category: 'Cosmetics' },
  { name: 'Oils',             category: 'Cosmetics' },
  { name: 'Face cream',       category: 'Cosmetics' },
  { name: 'Sindoor',          category: 'Cosmetics' },
  { name: 'Mirror',           category: 'Cosmetics' },
  { name: 'Combs',            category: 'Cosmetics' },
  { name: 'Mehendi',          category: 'Cosmetics' },
  { name: 'Neck lace set',    category: 'Cosmetics' },
  { name: 'Nose ring',        category: 'Cosmetics' },
  { name: 'Nose pin',         category: 'Cosmetics' },
  { name: 'Payal',            category: 'Cosmetics' },
  { name: 'Toe ring',         category: 'Cosmetics' },
  { name: 'Ring',             category: 'Cosmetics' },
  { name: 'Pad',              category: 'Cosmetics' },
  { name: 'Purse bag',        category: 'Cosmetics' },
  { name: 'Nail polish',      category: 'Cosmetics' },
  { name: 'Face spray',       category: 'Cosmetics' },
  { name: 'Hair colour',      category: 'Cosmetics' },
  { name: 'Body wash',        category: 'Cosmetics' },
  { name: 'Head shampoo',     category: 'Cosmetics' },
  { name: 'Revive',           category: 'Cosmetics' },
  { name: 'Comfort',          category: 'Cosmetics' },
  { name: 'Hair remove',      category: 'Cosmetics' },
  { name: 'Gulab jal',        category: 'Cosmetics' },
  { name: 'Hair clip',        category: 'Cosmetics' },
  { name: 'Eye .......',      category: 'Cosmetics' },
  { name: 'Hair band',        category: 'Cosmetics' },
  { name: 'Make up brush',    category: 'Cosmetics' },
  { name: 'Wipes',            category: 'Cosmetics' },
  { name: 'Diaper',           category: 'Cosmetics' },
  { name: 'Bindi',            category: 'Cosmetics' },
  { name: 'Dori',             category: 'Cosmetics' },
  { name: 'Hook',             category: 'Cosmetics' },
  { name: 'Lace',             category: 'Cosmetics' },
  { name: 'Oil',              category: 'Cosmetics' },
  { name: 'Needle',           category: 'Cosmetics' },
  { name: 'False',            category: 'Cosmetics' },
  { name: 'Thread',           category: 'Cosmetics' },
  { name: 'Bobbin',           category: 'Cosmetics' },
  { name: 'Caulk',            category: 'Cosmetics' },
  { name: 'Ball pin',         category: 'Cosmetics' },
  { name: 'Bobbin case',      category: 'Cosmetics' },
  { name: 'Pipe in',          category: 'Cosmetics' },
  { name: 'Tape',             category: 'Cosmetics' },
  { name: 'Yarn cutter',      category: 'Cosmetics' },

  // ===== Stationary (108) =====
  { name: '10/- Pen',                      category: 'Stationary' },
  { name: '05/- Pen',                      category: 'Stationary' },
  { name: 'Correction pen',                category: 'Stationary' },
  { name: 'Bold permanent marker',         category: 'Stationary' },
  { name: 'Bold whiteboard marker',        category: 'Stationary' },
  { name: 'DVD marker 4 colour',           category: 'Stationary' },
  { name: 'Colourful eraser',              category: 'Stationary' },
  { name: 'Normal eraser',                 category: 'Stationary' },
  { name: 'Pencil',                        category: 'Stationary' },
  { name: 'Camlin paste Glue',             category: 'Stationary' },
  { name: 'Fevi stick',                    category: 'Stationary' },
  { name: 'Fevi gum',                      category: 'Stationary' },
  { name: 'Sharpner',                      category: 'Stationary' },
  { name: 'Stick File',                    category: 'Stationary' },
  { name: 'Bag file',                      category: 'Stationary' },
  { name: 'Practical file cover',          category: 'Stationary' },
  { name: 'Protective sheet',              category: 'Stationary' },
  { name: 'Suitcase file',                 category: 'Stationary' },
  { name: 'Political map',                 category: 'Stationary' },
  { name: 'World map',                     category: 'Stationary' },
  { name: 'Graph paper',                   category: 'Stationary' },
  { name: 'Book cover',                    category: 'Stationary' },
  { name: 'Sticky notes',                  category: 'Stationary' },
  { name: 'Calculator',                    category: 'Stationary' },
  { name: 'Pin',                           category: 'Stationary' },
  { name: 'Pocket diary',                  category: 'Stationary' },
  { name: 'Highlighter',                   category: 'Stationary' },
  { name: 'Geometry box',                  category: 'Stationary' },
  { name: 'Pencil bag with chain',         category: 'Stationary' },
  { name: 'Craft paper',                   category: 'Stationary' },
  { name: 'A4 envelop',                    category: 'Stationary' },
  { name: 'Board duster',                  category: 'Stationary' },
  { name: 'Cutter',                        category: 'Stationary' },
  { name: 'Pencil kit',                    category: 'Stationary' },
  { name: 'Gel refill',                    category: 'Stationary' },
  { name: 'Scale large',                   category: 'Stationary' },
  { name: 'Scale small',                   category: 'Stationary' },
  { name: 'Hindi copy',                    category: 'Stationary' },
  { name: 'Maths copy',                    category: 'Stationary' },
  { name: 'English copy',                  category: 'Stationary' },
  { name: '02. Register',                  category: 'Stationary' },
  { name: '06. register',                  category: 'Stationary' },
  { name: '08 register',                   category: 'Stationary' },
  { name: 'Top quality register',          category: 'Stationary' },
  { name: 'Normal long copy',              category: 'Stationary' },
  { name: 'A4 bundle',                     category: 'Stationary' },
  { name: 'Bond paper bundle',             category: 'Stationary' },
  { name: 'Copy Nameplate',                category: 'Stationary' },
  { name: 'Price list sticker',            category: 'Stationary' },
  { name: 'Scissor',                       category: 'Stationary' },
  { name: 'Correction tape',               category: 'Stationary' },
  { name: 'Tiffin box',                    category: 'Stationary' },
  { name: 'Pen stand',                     category: 'Stationary' },
  { name: 'Stapler small',                 category: 'Stationary' },
  { name: 'Stapler medium',                category: 'Stationary' },
  { name: 'Stapler pin',                   category: 'Stationary' },
  { name: 'Stamp pad',                     category: 'Stationary' },
  { name: 'Clips',                         category: 'Stationary' },
  { name: 'Cello tape cutter small',       category: 'Stationary' },
  { name: 'Cello tape cutter large',       category: 'Stationary' },
  { name: 'Transparent chain pencil bag',  category: 'Stationary' },
  { name: 'Cello tape slim',               category: 'Stationary' },
  { name: 'Cello tape medium',             category: 'Stationary' },
  { name: 'Cello tape wide',               category: 'Stationary' },
  { name: 'Cello tape wide brown',         category: 'Stationary' },
  { name: 'Double tape',                   category: 'Stationary' },
  { name: 'Exam board',                    category: 'Stationary' },
  { name: 'Sparkle dry glitter',           category: 'Stationary' },
  { name: 'Paint brush',                   category: 'Stationary' },
  { name: 'Steel scale',                   category: 'Stationary' },
  { name: 'Pencil box worth 50',           category: 'Stationary' },
  { name: 'Pencil box worth 70',           category: 'Stationary' },
  { name: 'Pencil box worth 100',          category: 'Stationary' },
  { name: 'Pencil box worth 120',          category: 'Stationary' },
  { name: 'Pencil box worth 40',           category: 'Stationary' },
  { name: 'tiffin box worth',              category: 'Stationary' },
  { name: 'Water bottle worth 80',         category: 'Stationary' },
  { name: 'Water bottle worth 150',        category: 'Stationary' },
  { name: 'Water bottle worth 250',        category: 'Stationary' },
  { name: 'Water bottle worth 70',         category: 'Stationary' },
  { name: 'Water bottle worth 90',         category: 'Stationary' },
  { name: 'Water bottle worth 100',        category: 'Stationary' },
  { name: 'Water bottle worth 170',        category: 'Stationary' },
  { name: 'Paint brush sr 65 mini',        category: 'Stationary' },
  { name: 'Paint brush sr 64 mini',        category: 'Stationary' },
  { name: 'Paint brush sr 65 large',       category: 'Stationary' },
  { name: 'Paint brush sr 64 large',       category: 'Stationary' },
  { name: 'Oil pastel camel 12 shades',    category: 'Stationary' },
  { name: 'Oil pastel camel 25 shades',    category: 'Stationary' },
  { name: 'Oil pastel doms 12 shades',     category: 'Stationary' },
  { name: 'Sketch colour mini',            category: 'Stationary' },
  { name: 'Doms colour pencil 12 shades',  category: 'Stationary' },
  { name: 'Doms sketch max 14 pen',        category: 'Stationary' },
  { name: 'Camel acrylic colours white',   category: 'Stationary' },
  { name: 'Camel acrylic colours silver',  category: 'Stationary' },
  { name: 'Camel acrylic colours black',   category: 'Stationary' },
  { name: 'Camel acrylic colours blue',    category: 'Stationary' },
  { name: 'Camel acrylic colours sap green',   category: 'Stationary' },
  { name: 'Camel acrylic colours light peach', category: 'Stationary' },
  { name: 'Camel acrylic colours burnt umber', category: 'Stationary' },
  { name: 'Camel acrylic colours maroon',      category: 'Stationary' },
  { name: 'Camel acrylic colours crimson',     category: 'Stationary' },
  { name: 'Camel acrylic colours light green', category: 'Stationary' },
  { name: 'Camel acrylic colours orange',      category: 'Stationary' },
  { name: 'Camel acrylic colours deep green',  category: 'Stationary' },
  { name: 'Doms colour cake',              category: 'Stationary' },
  { name: 'Doms acrylic colours 12 shades',category: 'Stationary' },
  { name: 'Camel poster colour',           category: 'Stationary' },

  // ===== Puja Samagri (80) =====
  { name: 'SINDOOR 1',         category: 'Puja Samagri' },
  { name: 'SINDOOR 2',         category: 'Puja Samagri' },
  { name: 'SINDOOR 3',         category: 'Puja Samagri' },
  { name: 'ALTA',              category: 'Puja Samagri' },
  { name: 'PANCHA SASYA',      category: 'Puja Samagri' },
  { name: 'JOB',               category: 'Puja Samagri' },
  { name: 'TIL',               category: 'Puja Samagri' },
  { name: 'ATOP CHAL',         category: 'Puja Samagri' },
  { name: 'SUPARI',            category: 'Puja Samagri' },
  { name: 'HARITOKI',          category: 'Puja Samagri' },
  { name: 'GHEE',              category: 'Puja Samagri' },
  { name: 'MADHU',             category: 'Puja Samagri' },
  { name: 'DHUPKATHI 1',       category: 'Puja Samagri' },
  { name: 'DHUPKATHI 2',       category: 'Puja Samagri' },
  { name: 'DHUPKATHI 3',       category: 'Puja Samagri' },
  { name: 'DHUPKATHI 4',       category: 'Puja Samagri' },
  { name: 'DHUPKATHI 5',       category: 'Puja Samagri' },
  { name: 'DHUPKATHI 6',       category: 'Puja Samagri' },
  { name: 'DHAN',              category: 'Puja Samagri' },
  { name: 'KAPUR 1',           category: 'Puja Samagri' },
  { name: 'KAPUR 2',           category: 'Puja Samagri' },
  { name: 'SANKHA',            category: 'Puja Samagri' },
  { name: 'NAOA',              category: 'Puja Samagri' },
  { name: 'MODHUPORKER BATI',  category: 'Puja Samagri' },
  { name: 'PANCHA GURI',       category: 'Puja Samagri' },
  { name: 'ASTA GANDHA',       category: 'Puja Samagri' },
  { name: 'LAL CHANDAN',       category: 'Puja Samagri' },
  { name: 'SADA CHANDAN',      category: 'Puja Samagri' },
  { name: 'GANGA MATI',        category: 'Puja Samagri' },
  { name: 'GANGA JAL',         category: 'Puja Samagri' },
  { name: 'TEL 1',             category: 'Puja Samagri' },
  { name: 'TEL 2',             category: 'Puja Samagri' },
  { name: 'TEL 3',             category: 'Puja Samagri' },
  { name: 'DHUNA',             category: 'Puja Samagri' },
  { name: 'CHANDMALA',         category: 'Puja Samagri' },
  { name: 'MUKUT',             category: 'Puja Samagri' },
  { name: 'CHANDAN KATH 1',    category: 'Puja Samagri' },
  { name: 'CHANDAN KATH 2',    category: 'Puja Samagri' },
  { name: 'ABIR',              category: 'Puja Samagri' },
  { name: 'HAWAN SAMAGRI',     category: 'Puja Samagri' },
  { name: 'HAWAN LAKDI',       category: 'Puja Samagri' },
  { name: 'ASAN ANGURI',       category: 'Puja Samagri' },
  { name: 'POITA',             category: 'Puja Samagri' },
  { name: 'LAL DHAGA 1',       category: 'Puja Samagri' },
  { name: 'MOULI 1',           category: 'Puja Samagri' },
  { name: 'MOULI 2',           category: 'Puja Samagri' },
  { name: 'MASKOLAI',          category: 'Puja Samagri' },
  { name: 'SADA SORSE',        category: 'Puja Samagri' },
  { name: 'PAKHA',             category: 'Puja Samagri' },
  { name: 'KHADAM',            category: 'Puja Samagri' },
  { name: 'MADUR',             category: 'Puja Samagri' },
  { name: 'CHAMOR 1',          category: 'Puja Samagri' },
  { name: 'CHAMOR 2',          category: 'Puja Samagri' },
  { name: 'PITTAL PRADIP',     category: 'Puja Samagri' },
  { name: 'KANSA THALA',       category: 'Puja Samagri' },
  { name: 'KANSDA BATI',       category: 'Puja Samagri' },
  { name: 'KANSA GLASS',       category: 'Puja Samagri' },
  { name: 'KODI',              category: 'Puja Samagri' },
  { name: 'KAMBAL ASAN',       category: 'Puja Samagri' },
  { name: 'KUSHA ASAN',        category: 'Puja Samagri' },
  { name: 'KUSH',              category: 'Puja Samagri' },
  { name: 'LOKHI CHUBRI',      category: 'Puja Samagri' },
  { name: 'GHUMSI KALO',       category: 'Puja Samagri' },
  { name: 'MALA 1',            category: 'Puja Samagri' },
  { name: 'MALA 2',            category: 'Puja Samagri' },
  { name: 'MALA 3',            category: 'Puja Samagri' },
  { name: 'MALA 4',            category: 'Puja Samagri' },
  { name: 'LOKHI PACHALI',     category: 'Puja Samagri' },
  { name: 'GITA',              category: 'Puja Samagri' },
  { name: 'BORON KULO',        category: 'Puja Samagri' },
  { name: 'HAWAN KATH GURO',   category: 'Puja Samagri' },
  { name: 'TIR KATHI',         category: 'Puja Samagri' },
  { name: 'LOMBA TULO',        category: 'Puja Samagri' },
  { name: 'LOOSE TULO',        category: 'Puja Samagri' },
  { name: 'GOL TULO',          category: 'Puja Samagri' },
  { name: 'KAJOL LATA',        category: 'Puja Samagri' },
  { name: 'JANTI',             category: 'Puja Samagri' },
  { name: 'SAREE',             category: 'Puja Samagri' },
  { name: 'GAMCHA',            category: 'Puja Samagri' },
  { name: 'DHUTI',             category: 'Puja Samagri' },
];

async function seed() {
  console.log('\n========================================');
  console.log('  Syncing Product Catalog (290 materials)');
  console.log('========================================\n');

  await mongoose.connect(MONGO_URI);
  console.log(`✔ Connected to MongoDB: ${MONGO_URI}\n`);

  // 1. Categories
  const categoryIdMap = {};
  for (const catName of CATEGORIES) {
    const result = await Category.findOneAndUpdate(
      { name: catName },
      { $setOnInsert: { name: catName, isActive: true } },
      { upsert: true, new: true }
    );
    categoryIdMap[catName] = result._id;
  }

  // 2. Sync / Upsert 290 Products
  const COST_PRICES    = [1, 2, 3, 4];
  const SELL_PRICES    = [2, 3, 4, 4];
  const STOCK_LEVELS   = [1, 2, 3, 4];

  let insertedCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < SEED_PRODUCTS.length; i++) {
    const p = SEED_PRODUCTS[i];
    const categoryId = categoryIdMap[p.category];

    const slot = i % 4;
    const costPrice = COST_PRICES[slot];
    const sellingPrice = SELL_PRICES[slot];
    const currentStock = STOCK_LEVELS[slot];

    const existing = await Product.findOne({ name: p.name, category: categoryId });

    if (!existing) {
      await Product.create({
        name: p.name,
        category: categoryId,
        costPrice,
        sellingPrice,
        currentStock,
        lowStockThreshold: 5,
        unit: 'pcs',
        isActive: true
      });
      insertedCount++;
    } else {
      await Product.updateOne(
        { _id: existing._id },
        {
          $set: {
            name: p.name,
            category: categoryId,
            isActive: true
          }
        }
      );
      updatedCount++;
    }
  }

  console.log(`✅ Completed: ${insertedCount} inserted, ${updatedCount} verified/synced.`);
  console.log(`📦 Total Materials in Catalog: ${SEED_PRODUCTS.length}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[SEED ERROR]', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
