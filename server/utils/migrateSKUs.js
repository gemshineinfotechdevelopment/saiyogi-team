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
      if (!cat.categoryCode) {
        cat.categoryCode = catCodeNum.toString();
        await cat.save();
        console.log(`Updated Category ${cat.name} with code ${cat.categoryCode}`);
        catCodeNum += 10;
      } else {
        const codeNum = parseInt(cat.categoryCode, 10);
        if (!isNaN(codeNum) && codeNum >= catCodeNum) {
          catCodeNum = codeNum + 10;
        }
      }
    }

    console.log('Finished Category Migration. Starting Product Migration...');

    const products = await Product.find().populate('category');
    
    // Map to keep track of max sequence per category code
    const seqMap = {};
    for (const p of products) {
        if (p.category && p.category.categoryCode) {
            const catCode = p.category.categoryCode;
            if (p.sku && p.sku.startsWith(catCode)) {
                const seq = parseInt(p.sku.substring(catCode.length), 10);
                if (!isNaN(seq)) {
                    if (!seqMap[catCode] || seq > seqMap[catCode]) {
                        seqMap[catCode] = seq;
                    }
                }
            }
        }
    }

    for (const p of products) {
      if (p.category && p.category.categoryCode) {
        const catCode = p.category.categoryCode;
        
        if (!p.sku || !p.sku.startsWith(catCode)) {
            if (!seqMap[catCode]) seqMap[catCode] = 0;
            seqMap[catCode]++;
            const newSku = catCode + seqMap[catCode].toString();
            p.sku = newSku;
            p.code = newSku;
            await p.save();
            console.log(`Updated Product ${p.name} with SKU ${newSku}`);
        }
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
