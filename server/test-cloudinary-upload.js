import { uploadToCloudinary } from './utils/cloudinary.js';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.log('Cloudinary credentials missing in .env, skipping upload test.');
  process.exit(0);
}

// 1x1 PNG (base64)
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
const buffer = Buffer.from(pngBase64, 'base64');

(async () => {
  try {
    console.log('Uploading test 1x1 PNG to Cloudinary...');
    const res = await uploadToCloudinary(buffer, 'test.png', 'tests');
    console.log('Upload result:', res);
  } catch (err) {
    console.error('Upload failed. Full error object:');
    console.error(err);
    process.exit(1);
  }
})();
