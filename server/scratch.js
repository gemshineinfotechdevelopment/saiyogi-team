import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import Product from './models/Product.js';
import inventoryService from './services/inventoryService.js';

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Find a product
  const product = await Product.findOne({ isActive: true });
  if (!product) {
    console.log('No product found');
    process.exit(0);
  }

  console.log(`Testing with product: ${product.name}, stock: ${product.stock}, storeStockPieces: ${product.storeStockPieces}`);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const qtyToDeduct = 1;
    if (product.storeStockPieces >= qtyToDeduct) {
      await inventoryService.reduceStock(
        product._id,
        qtyToDeduct,
        'TEST_BILL',
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        'Test reduction',
        session,
        'TEST-123'
      );
      console.log('reduceStock called successfully');
      
      await session.commitTransaction();
      console.log('Transaction committed');

      const updatedProduct = await Product.findById(product._id);
      console.log(`After update: stock: ${updatedProduct.stock}, storeStockPieces: ${updatedProduct.storeStockPieces}`);
    } else {
      console.log('Not enough stock to test');
    }
  } catch (err) {
    console.error('Error during test:', err);
    await session.abortTransaction();
  } finally {
    session.endSession();
    mongoose.disconnect();
  }
}

test();
