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
    const category1 = new Category({
      name: 'Sparklers',
      categoryCode: 'SPARK',
      description: 'Sparkling fireworks for everyone',
      icon: 'sparkles',
      displayOrder: 1
    });

    const category2 = new Category({
      name: 'Rockets',
      categoryCode: 'ROCK',
      description: 'Sky rockets',
      icon: 'rocket',
      displayOrder: 2
    });

    const savedCat1 = await category1.save();
    const savedCat2 = await category2.save();
    console.log('Categories seeded successfully');

    // Seed Products
    const product1 = new Product({
      name: '10cm Electric Sparklers',
      description: 'Box of 10 electric sparklers',
      code: 'SP-10',
      sku: 'SKU-SP-10',
      category: savedCat1._id,
      price: 50,
      wholesalePrice: 40,
      netRate: 35,
      stock: 500,
      minimumStock: 50,
      unit: 'box',
      image: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?q=80&w=200&auto=format&fit=crop',
      isActive: true
    });

    const product2 = new Product({
      name: 'Sky Shot Rocket',
      description: 'A classic sky shot rocket',
      code: 'RK-SS',
      sku: 'SKU-RK-SS',
      category: savedCat2._id,
      price: 120,
      wholesalePrice: 100,
      netRate: 90,
      stock: 200,
      minimumStock: 20,
      unit: 'piece',
      image: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?q=80&w=200&auto=format&fit=crop',
      isActive: true
    });

    await product1.save();
    await product2.save();
    console.log('Products seeded successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedSampleData();
