import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Category from './models/Category.js';
import Product from './models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const seedSampleData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding');

    // Clear existing sample data if any
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Seed Categories
    const categoriesData = [
      { name: 'Sparklers', categoryCode: '100', description: 'Sparkling fireworks for everyone', displayOrder: 1, slug: 'sparklers' },
      { name: 'Flower Pots', categoryCode: '110', description: 'Classic fountain pots', displayOrder: 2, slug: 'flower-pots' },
      { name: 'Ground Chakkars', categoryCode: '120', description: 'Spinning wheels on the ground', displayOrder: 3, slug: 'ground-chakkars' },
      { name: 'Sky Shots', categoryCode: '130', description: 'Beautiful aerial sky shots', displayOrder: 4, slug: 'sky-shots' },
      { name: 'Combo Packs', categoryCode: '140', description: 'Great value combo collections', displayOrder: 5, slug: 'combo-packs' }
    ];

    const savedCategories = await Category.insertMany(categoriesData);
    const catMap = savedCategories.reduce((acc, cat) => {
      acc[cat.name] = cat._id;
      return acc;
    }, {});
    console.log('Categories seeded successfully');

    // Seed Products
    const productsData = [
      {
        name: '10cm Electric Sparklers', description: 'Safe for kids', code: 'SP-10', sku: 'SKU-SP-10', category: catMap['Sparklers'],
        price: 50, wholesalePrice: 40, netRate: 35, stock: 500, minimumStock: 50, image: '/flower_pots.png', isActive: true, storeStockPieces: 500, hasDiscount: true
      },
      {
        name: '15cm Green Sparklers', description: 'Color changing', code: 'SP-15G', sku: 'SKU-SP-15G', category: catMap['Sparklers'],
        price: 80, wholesalePrice: 70, netRate: 65, stock: 400, minimumStock: 40, image: '/sky_rocket_box.png', isActive: true, storeStockPieces: 400, hasDiscount: false
      },
      {
        name: 'Flower Pots Small', description: 'Classic fountain', code: 'FP-S', sku: 'SKU-FP-S', category: catMap['Flower Pots'],
        price: 120, wholesalePrice: 100, netRate: 90, stock: 300, minimumStock: 30, image: '/flower_pots.png', isActive: true, storeStockPieces: 300, hasDiscount: true
      },
      {
        name: 'Flower Pots Big', description: 'High reaching fountain', code: 'FP-B', sku: 'SKU-FP-B', category: catMap['Flower Pots'],
        price: 200, wholesalePrice: 180, netRate: 160, stock: 200, minimumStock: 20, image: '/sky_rocket_box.png', isActive: true, storeStockPieces: 200, hasDiscount: false
      },
      {
        name: 'Ground Chakkar Normal', description: 'Spinning wheel', code: 'GC-N', sku: 'SKU-GC-N', category: catMap['Ground Chakkars'],
        price: 90, wholesalePrice: 80, netRate: 75, stock: 0, minimumStock: 50, image: '/flower_pots.png', isActive: true, storeStockPieces: 0, hasDiscount: false
      },
      {
        name: 'Ground Chakkar Special', description: 'Long lasting spin', code: 'GC-S', sku: 'SKU-GC-S', category: catMap['Ground Chakkars'],
        price: 150, wholesalePrice: 130, netRate: 120, stock: 450, minimumStock: 40, image: '/sky_rocket_box.png', isActive: true, storeStockPieces: 450, hasDiscount: true
      },
      {
        name: '7 Shots', description: 'Multi-color aerial', code: 'SKY-7', sku: 'SKU-SKY-7', category: catMap['Sky Shots'],
        price: 350, wholesalePrice: 300, netRate: 280, stock: 150, minimumStock: 15, image: '/flower_pots.png', isActive: true, storeStockPieces: 150, hasDiscount: true
      },
      {
        name: '12 Shots', description: 'Premium sky show', code: 'SKY-12', sku: 'SKU-SKY-12', category: catMap['Sky Shots'],
        price: 550, wholesalePrice: 500, netRate: 480, stock: 100, minimumStock: 10, image: '/sky_rocket_box.png', isActive: true, storeStockPieces: 100, hasDiscount: false
      },
      {
        name: 'Family Star Combo Pack', description: 'A perfect mix of 45 items', code: 'CMB-F', sku: 'SKU-CMB-F', category: catMap['Combo Packs'],
        price: 1500, wholesalePrice: 1300, netRate: 1200, stock: 50, minimumStock: 5, image: '/family_star_kit.png', isActive: true, storeStockPieces: 50, hasDiscount: true
      },
      {
        name: 'Grand Sky Delight Combo', description: 'Elite 75-item collection', code: 'CMB-G', sku: 'SKU-CMB-G', category: catMap['Combo Packs'],
        price: 2500, wholesalePrice: 2200, netRate: 2000, stock: 30, minimumStock: 5, image: '/grand_sky_delight.png', isActive: true, storeStockPieces: 30, hasDiscount: true
      }
    ];

    await Product.insertMany(productsData);
    console.log('Products seeded successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedSampleData();
