import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

const autoSeedIfEmpty = async () => {
  try {
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      logger.info('Database empty, seeding default categories and products...');
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

      const productsData = [
        {
          name: '10cm Electric Sparklers', description: 'Safe for kids', code: '1001', sku: '1001', category: catMap['Sparklers'],
          price: 50, wholesalePrice: 40, netRate: 35, stock: 500, minimumStock: 50, image: '/flower_pots.png', isActive: true, storeStockPieces: 500, hasDiscount: true
        },
        {
          name: '15cm Green Sparklers', description: 'Color changing', code: '1002', sku: '1002', category: catMap['Sparklers'],
          price: 80, wholesalePrice: 70, netRate: 65, stock: 400, minimumStock: 40, image: '/sky_rocket_box.png', isActive: true, storeStockPieces: 400, hasDiscount: false
        },
        {
          name: 'Flower Pots Small', description: 'Classic fountain', code: '1101', sku: '1101', category: catMap['Flower Pots'],
          price: 120, wholesalePrice: 100, netRate: 90, stock: 300, minimumStock: 30, image: '/flower_pots.png', isActive: true, storeStockPieces: 300, hasDiscount: true
        },
        {
          name: 'Flower Pots Big', description: 'High reaching fountain', code: '1102', sku: '1102', category: catMap['Flower Pots'],
          price: 200, wholesalePrice: 180, netRate: 160, stock: 200, minimumStock: 20, image: '/sky_rocket_box.png', isActive: true, storeStockPieces: 200, hasDiscount: false
        },
        {
          name: 'Ground Chakkar Normal', description: 'Spinning wheel', code: '1201', sku: '1201', category: catMap['Ground Chakkars'],
          price: 90, wholesalePrice: 80, netRate: 75, stock: 100, minimumStock: 50, image: '/flower_pots.png', isActive: true, storeStockPieces: 100, hasDiscount: false
        },
        {
          name: 'Ground Chakkar Special', description: 'Long lasting spin', code: '1202', sku: '1202', category: catMap['Ground Chakkars'],
          price: 150, wholesalePrice: 130, netRate: 120, stock: 450, minimumStock: 40, image: '/sky_rocket_box.png', isActive: true, storeStockPieces: 450, hasDiscount: true
        },
        {
          name: '7 Shots', description: 'Multi-color aerial', code: '1301', sku: '1301', category: catMap['Sky Shots'],
          price: 350, wholesalePrice: 300, netRate: 280, stock: 150, minimumStock: 15, image: '/flower_pots.png', isActive: true, storeStockPieces: 150, hasDiscount: true
        },
        {
          name: '12 Shots', description: 'Premium sky show', code: '1302', sku: '1302', category: catMap['Sky Shots'],
          price: 550, wholesalePrice: 500, netRate: 480, stock: 100, minimumStock: 10, image: '/sky_rocket_box.png', isActive: true, storeStockPieces: 100, hasDiscount: false
        },
        {
          name: 'Family Star Combo Pack', description: 'A perfect mix of 45 items', code: '1401', sku: '1401', category: catMap['Combo Packs'],
          price: 1500, wholesalePrice: 1300, netRate: 1200, stock: 50, minimumStock: 5, image: '/family_star_kit.png', isActive: true, storeStockPieces: 50, hasDiscount: true
        },
        {
          name: 'Grand Sky Delight Combo', description: 'Elite 75-item collection', code: '1402', sku: '1402', category: catMap['Combo Packs'],
          price: 2500, wholesalePrice: 2200, netRate: 2000, stock: 30, minimumStock: 5, image: '/grand_sky_delight.png', isActive: true, storeStockPieces: 30, hasDiscount: true
        }
      ];

      await Product.insertMany(productsData);
      logger.info('Categories and Products seeded successfully.');
    }
  } catch (err) {
    logger.warn('Auto-seed check encountered warning:', err.message);
  }
};

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI;

  if (primaryUri) {
    try {
      const conn = await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
      logger.info(`MongoDB Connected: ${conn.connection.host} / Database: ${conn.connection.name}`);
      await autoSeedIfEmpty();
      return;
    } catch (error) {
      logger.error(`Error connecting to primary MONGODB_URI: ${error.message}`);
    }
  }

  // Fallback to local 127.0.0.1:27017
  try {
    const localUri = "mongodb://127.0.0.1:27017/saiyogi";
    const conn = await mongoose.connect(localUri, { serverSelectionTimeoutMS: 4000 });
    logger.info(`MongoDB Connected locally: ${conn.connection.host} / Database: ${conn.connection.name}`);
    await autoSeedIfEmpty();
    return;
  } catch (localError) {
    logger.warn(`Local MongoDB (127.0.0.1:27017) not available: ${localError.message}`);
  }

  // Fallback to In-Memory MongoDB Server for offline/standalone dev
  try {
    logger.info('Starting fallback in-memory MongoDB Server...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const memoryUri = mongoServer.getUri();
    const conn = await mongoose.connect(memoryUri);
    logger.info(`InMemory MongoDB Connected: ${conn.connection.host} / Database: ${conn.connection.name}`);
    await autoSeedIfEmpty();
  } catch (memError) {
    logger.error('Failed to initialize in-memory MongoDB server:', memError.message);
    process.exit(1);
  }
};

export default connectDB;
