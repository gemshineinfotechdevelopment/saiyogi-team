import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const categories = await Category.find().sort({ createdAt: 1 });
    let catCodeNum = 100;
    
    for (const cat of categories) {
      // Force assign numeric categoryCode (100, 110, 120, 130...)
      const currentNum = parseInt(cat.categoryCode, 10);
      if (isNaN(currentNum) || !cat.categoryCode) {
        cat.categoryCode = catCodeNum.toString();
        await cat.save();
        console.log(`Updated Category "${cat.name}" with code ${cat.categoryCode}`);
        catCodeNum += 10;
      } else {
        catCodeNum = Math.max(catCodeNum, currentNum + 10);
      }
    }

    console.log('Finished Category Migration. Starting Product Migration...');

    const products = await Product.find().populate('category');
    
    // Group products by category and reassign SKUs as categoryCode + 1, 2, 3...
    const catProductCount = {};
    for (const p of products) {
      if (p.category && p.category.categoryCode) {
        const catCode = p.category.categoryCode;
        if (!catProductCount[catCode]) {
          catProductCount[catCode] = 0;
        }
        catProductCount[catCode]++;
        const catNum = parseInt(catCode, 10);
        let newSku;
        if (!isNaN(catNum)) {
          const base = catCode.length === 3 ? catNum * 10 : catNum;
          newSku = (base + catProductCount[catCode]).toString();
        } else {
          newSku = `${catCode}${catProductCount[catCode]}`;
        }
        p.sku = newSku;
        p.code = newSku;
        await p.save();
        console.log(`Updated Product "${p.name}" -> Category "${p.category.name}" (${catCode}) -> SKU: ${newSku}`);
      }
    }

    console.log('Migration Complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
