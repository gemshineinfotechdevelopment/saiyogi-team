/**
 * dedup-brands.js
 * ───────────────
 * 1. Groups all Brand documents by name (case-insensitive).
 * 2. For each group with more than one entry, keeps the OLDEST document
 *    and deletes the rest.
 * 3. Scans all Product documents whose `brand` string matches any
 *    variant (different casing / whitespace) of a known brand name and
 *    normalises it to the exact canonical name stored in the Brand collection.
 *
 * Run from the `server/` directory:
 *   node scripts/dedup-brands.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// ── Models ──────────────────────────────────────────────────────────────────
const brandSchema = new mongoose.Schema(
  {
    brandId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    logo: { type: String, trim: true, default: '/sky_rocket_box.png' },
    description: { type: String, trim: true, default: '' },
    itemsCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
const Brand = mongoose.models.Brand || mongoose.model('Brand', brandSchema);

const productSchema = new mongoose.Schema(
  { brand: { type: String, trim: true } },
  { strict: false, timestamps: true }
);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.\n');

  // Step 1: Load all brands (oldest first)
  const allBrands = await Brand.find({}).sort({ createdAt: 1 });
  console.log(`Total brand documents found: ${allBrands.length}`);

  // Group by lowercase name
  const groups = new Map();
  for (const b of allBrands) {
    const key = (b.name || '').trim().toLowerCase();
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(b);
  }

  // Step 2: Deduplicate brand documents, build canonical name map
  const canonicalMap = new Map(); // lowerName -> canonical stored name
  let totalBrandsDeleted = 0;

  for (const [lowerName, docs] of groups) {
    const canonical = docs[0]; // oldest = keeper
    canonicalMap.set(lowerName, canonical.name.trim());

    if (docs.length > 1) {
      const dupeIds = docs.slice(1).map(d => d._id);
      console.log(`  Duplicate brand "${canonical.name}" — keeping _id:${canonical._id}, deleting ${dupeIds.length} duplicate(s)`);
      await Brand.deleteMany({ _id: { $in: dupeIds } });
      totalBrandsDeleted += dupeIds.length;
    }
  }

  console.log(`\n✓ Brands deduplicated. Deleted: ${totalBrandsDeleted} duplicate(s).\n`);

  // Step 3: Normalise product brand strings
  const products = await Product.find({ brand: { $exists: true, $ne: '' } }, 'brand').lean();
  console.log(`Products with a brand value: ${products.length}`);

  let totalProductsUpdated = 0;
  let totalProductsSkipped = 0;

  for (const p of products) {
    const rawBrand = (p.brand || '').trim();
    const lowerBrand = rawBrand.toLowerCase();
    const canonical = canonicalMap.get(lowerBrand);

    if (!canonical) {
      totalProductsSkipped++;
      continue;
    }

    if (rawBrand === canonical) continue; // Already correct

    await Product.updateOne({ _id: p._id }, { $set: { brand: canonical } });
    console.log(`  Product _id:${p._id}  "${rawBrand}" -> "${canonical}"`);
    totalProductsUpdated++;
  }

  console.log(`\n✓ Product brands normalised.`);
  console.log(`  Updated: ${totalProductsUpdated}`);
  console.log(`  Skipped (brand not in Brand collection): ${totalProductsSkipped}`);
  console.log(`\nAll done!`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
