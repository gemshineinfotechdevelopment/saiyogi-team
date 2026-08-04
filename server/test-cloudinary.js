import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from this script's directory (server/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Env has CLOUDINARY_CLOUD_NAME:', !!process.env.CLOUDINARY_CLOUD_NAME);
console.log('Env has CLOUDINARY_API_KEY:', !!process.env.CLOUDINARY_API_KEY);
console.log('Env has CLOUDINARY_API_SECRET:', !!process.env.CLOUDINARY_API_SECRET);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

(async () => {
  try {
    console.log('Testing Cloudinary API credentials...');
    const res = await cloudinary.api.resources({ max_results: 1 });
    console.log('Cloudinary API call succeeded. Sample response:');
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Cloudinary API call failed. Error details:');
    if (err && err.http_code) console.error('HTTP Code:', err.http_code);
    if (err && err.code) console.error('Code:', err.code);
    console.error(err.message || err);
    console.error('Full error object:', err);
    process.exit(1);
  }
})();
