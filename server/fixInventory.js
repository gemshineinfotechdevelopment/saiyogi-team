import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkProducts() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const products = await db.collection('products').find({ stock: { $exists: false } }).toArray();
  const productsNull = await db.collection('products').find({ stock: null }).toArray();
  console.log('Products missing stock:', products.length);
  console.log('Products with null stock:', productsNull.length);
  
  // also let's just print a few to see what they look like
  const allProducts = await db.collection('products').find({}).limit(2).toArray();
  console.log('Sample product:', JSON.stringify(allProducts[0], null, 2));
  process.exit(0);
}
checkProducts();
