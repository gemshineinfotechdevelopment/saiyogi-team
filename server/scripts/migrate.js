import admin from 'firebase-admin';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import Product from '../models/Product.js';
import Category from '../models/Category.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Setup Firebase (requires service account key JSON)
// Replace './serviceAccountKey.json' with actual path if running this script
const serviceAccountPath = path.join(__dirname, '../config/firebase-service-account.json');
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath)
  });
} catch (e) {
  console.error("Firebase Admin initialization failed. Ensure you have the service account key at server/config/firebase-service-account.json", e.message);
  process.exit(1);
}

const firestore = admin.firestore();

// Setup MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const migrateData = async () => {
  try {
    console.log('Starting migration...');

    // 1. Migrate Categories
    console.log('Fetching Firebase Categories...');
    const categoriesSnapshot = await firestore.collection('categories').get();
    const categoryMap = new Map(); // Map old ID to new MongoDB _id

    for (const doc of categoriesSnapshot.docs) {
      const data = doc.data();
      const existing = await Category.findOne({ name: data.name });

      if (existing) {
        console.log(`Category already exists: ${data.name}`);
        categoryMap.set(doc.id, existing._id);
      } else {
        const newCategory = new Category({
          name: data.name,
          slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
          icon: data.icon,
          image: data.image,
          description: data.description,
          isActive: data.isActive !== false,
          displayOrder: data.displayOrder || 0
        });
        const saved = await newCategory.save();
        console.log(`Migrated category: ${data.name}`);
        categoryMap.set(doc.id, saved._id);
      }
    }

    // 2. Migrate Products
    console.log('Fetching Firebase Products...');
    const productsSnapshot = await firestore.collection('products').get();

    for (const doc of productsSnapshot.docs) {
      const data = doc.data();
      const existing = await Product.findOne({ name: data.name });

      if (!existing) {
        const mappedCategoryId = data.category ? categoryMap.get(data.category) : null;

        const newProduct = new Product({
          name: data.name,
          description: data.description || '',
          code: data.code || `PRD-${Date.now().toString().slice(-6)}`,
          sku: data.sku || `SKU-${Date.now().toString().slice(-6)}`,
          category: mappedCategoryId,
          image: data.image,
          imagePublicId: data.imagePublicId,
          
          // Old single price logic to unified
          retailPrice: data.price || 0,
          wholesalePrice: data.price ? data.price * 0.9 : 0, // Mock calculation
          netRatePrice: data.price ? data.price * 0.8 : 0, // Mock calculation
          
          originalPrice: data.originalPrice,
          stock: data.stock || 0,
          minimumStock: data.minimumStock || 10,
          unit: data.unit || 'pcs',
          
          isActive: data.isActive !== false,
          isNewProduct: data.isNewProduct || false,
          isFeatured: data.isFeatured || false,
          isOffer: data.isOffer || false,
          offerPrice: data.offerPrice,
          offerDescription: data.offerDescription,
          displayOrder: data.displayOrder || 0
        });

        await newProduct.save();
        console.log(`Migrated product: ${data.name}`);
      } else {
        console.log(`Product already exists: ${data.name}`);
      }
    }

    console.log('Migration complete!');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateData();
