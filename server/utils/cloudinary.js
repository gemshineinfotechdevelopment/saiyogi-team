import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import streamifier from 'streamifier';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure we load the server/.env file relative to this util file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Prefer a single CLOUDINARY_URL env var (cloudinary://key:secret@cloud_name)
if (process.env.CLOUDINARY_URL) {
  console.log('Using CLOUDINARY_URL from environment');
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

export const uploadToCloudinary = (buffer, originalname, folder = 'uploads') => {
  return new Promise((resolve, reject) => {
    try {
      const timestamp = Date.now();
      const filename = `${folder}_${timestamp}_${originalname}`.replace(/[^a-zA-Z0-9.\-_\/]/g, '_');

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: filename.replace(/\.[^/.]+$/, ''),
          overwrite: true,
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error details:', error);
            return reject(error);
          }
          resolve({ url: result.secure_url, public_id: result.public_id, raw: result });
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    } catch (err) {
      reject(err);
    }
  });
};

export const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (!imageUrl) return;

    // If the input looks like a Cloudinary URL, extract public_id; otherwise treat it as public_id
    let publicId = imageUrl;
    if (imageUrl.includes('res.cloudinary.com') || imageUrl.includes('/upload/')) {
      const parts = imageUrl.split('/');
      const uploadIndex = parts.findIndex(p => p === 'upload');
      if (uploadIndex === -1) return;
      publicId = parts.slice(uploadIndex + 1).join('/');
      // remove version if present
      publicId = publicId.replace(/^v\d+\//, '');
      // strip extension
      publicId = publicId.replace(/\.[a-zA-Z0-9]+(\?.*)?$/, '');
    }

    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    console.log('✓ Image deleted from Cloudinary:', publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error.message || error);
  }
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary
};
