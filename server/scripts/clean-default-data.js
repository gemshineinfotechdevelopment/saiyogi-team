import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function inspectAndClean() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB:', mongoose.connection.name);

  const db = mongoose.connection.db;
  const productsCol = db.collection('products');
  const categoriesCol = db.collection('categories');
  const brandsCol = db.collection('brands');

  const products = await productsCol.find({}).toArray();
  const categories = await categoriesCol.find({}).toArray();
  const brands = await brandsCol.find({}).toArray();

  console.log('\n=== CURRENT PRODUCTS IN DB ===');
  products.forEach(p => console.log(`- [${p._id}] ${p.name} (Category: ${p.category}, Code: ${p.code})`));

  console.log('\n=== CURRENT CATEGORIES IN DB ===');
  categories.forEach(c => console.log(`- [${c._id}] ${c.name} (Code: ${c.categoryCode})`));

  console.log('\n=== CURRENT BRANDS IN DB ===');
  brands.forEach(b => console.log(`- [${b._id}] ${b.name} (BrandID: ${b.brandId})`));

  // Clean out sample default items if they match static sample names/IDs
  const defaultProductNames = [
    "Whistling Birds",
    "Flower Pots Big",
    "1000 Wala Red Garland",
    "King Of Kings Sky Shot",
    "Twinkling Star Sparklers",
    "Chakkra Special Deluxe",
    "Family Star Kit",
    "Grand Sky Delight",
    "Kids Joy Bundle",
    "Royal Celebration"
  ];

  const deletedProds = await productsCol.deleteMany({
    $or: [
      { name: { $in: defaultProductNames } },
      { code: { $regex: /^prod-/i } }
    ]
  });
  console.log(`\nRemoved ${deletedProds.deletedCount} default sample products from DB.`);

  await mongoose.disconnect();
}

inspectAndClean().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
