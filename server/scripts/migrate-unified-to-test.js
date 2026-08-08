import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ATLAS_BASE_URI = (process.env.MONGODB_URI || '').split('?')[0].replace(/\/([^\/]*)$/, '');
const OPTIONS = (process.env.MONGODB_URI || '').includes('?') ? '?' + process.env.MONGODB_URI.split('?')[1] : '';

const sourceDbName = 'unified-crackers-erp';
const targetDbName = 'test';

async function migrateData() {
  const uri = process.env.MONGODB_URI;
  console.log('Connecting to Atlas Cluster...');
  
  const clientConn = await mongoose.connect(uri);
  const adminDb = clientConn.connection.db.admin();
  
  // Direct db references
  const sourceDb = clientConn.connection.client.db(sourceDbName);
  const targetDb = clientConn.connection.client.db(targetDbName);

  console.log(`\n=== STEP 1: Inspecting databases ===`);
  const sourceCollections = await sourceDb.listCollections().toArray();
  console.log(`Source Database [${sourceDbName}] collections:`, sourceCollections.map(c => c.name));

  const targetCollections = await targetDb.listCollections().toArray();
  console.log(`Target Database [${targetDbName}] collections:`, targetCollections.map(c => c.name));

  console.log(`\n=== STEP 2: Merging data from [${sourceDbName}] into [${targetDbName}] ===`);

  for (const colInfo of sourceCollections) {
    const colName = colInfo.name;
    if (colName.startsWith('system.')) continue;

    const sourceCol = sourceDb.collection(colName);
    const targetCol = targetDb.collection(colName);

    const docs = await sourceCol.find({}).toArray();
    console.log(`\nProcessing collection '${colName}': ${docs.length} documents in source`);

    let copiedCount = 0;
    let skippedCount = 0;

    for (const doc of docs) {
      try {
        const existing = await targetCol.findOne({ _id: doc._id });
        if (!existing) {
          await targetCol.insertOne(doc);
          copiedCount++;
        } else {
          // If document exists, update fields that might be newer
          await targetCol.replaceOne({ _id: doc._id }, doc, { upsert: true });
          skippedCount++;
        }
      } catch (err) {
        console.error(`Error copying doc _id ${doc._id} in ${colName}:`, err.message);
      }
    }

    const finalTargetCount = await targetCol.countDocuments();
    console.log(`✓ '${colName}': Inserted ${copiedCount}, Updated/Merged ${skippedCount}. Total in '${targetDbName}.${colName}': ${finalTargetCount}`);
  }

  console.log(`\n=== STEP 3: Dropping source database [${sourceDbName}] ===`);
  try {
    await sourceDb.dropDatabase();
    console.log(`✓ Database '${sourceDbName}' successfully dropped!`);
  } catch (err) {
    console.error(`Failed to drop database '${sourceDbName}':`, err.message);
  }

  console.log(`\n=== Migration Complete ===`);
  await mongoose.disconnect();
}

migrateData().catch((err) => {
  console.error('Migration failed with error:', err);
  process.exit(1);
});
