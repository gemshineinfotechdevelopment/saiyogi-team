import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Product from './models/Product.js';

async function fixCodes() {
  try {
    // connect to DB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crackers_shop';
    console.log("Connecting to", mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // get all products sorted by creation time
    const products = await Product.find({}).sort({ createdAt: 1 });
    
    let currentCode = 1001;

    for (const product of products) {
      product.code = currentCode.toString();
      product.sku = currentCode.toString();
      await product.save();
      console.log(`Updated product ${product.name} to code ${currentCode}`);
      currentCode++;
    }

    console.log('Successfully updated all product codes!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

fixCodes();
