import { uploadToCloudinary, deleteFromCloudinary } from './cloudinary.js';
import fs from 'fs';
import path from 'path';

const SERVER_BASE = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;

/**
 * Upload image to Cloudinary (with local fallback)
 * @param {object} file - The file object from multer (contains buffer, originalname, etc.)
 * @param {string} folder - The folder to upload to (e.g., 'products', 'categories')
 * @returns {Promise<string>} The URL of the uploaded image
 */
export const uploadToBoth = async (file, folder) => {
    if (!file) {
        throw new Error('No file provided for upload');
    }

    try {
        const result = await uploadToCloudinary(file.buffer, file.originalname, folder);
        return { url: result.url, public_id: result.public_id };
    } catch (error) {
        const errorMsg = `Cloudinary upload failed: ${error.message || error}. Verify CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET in .env file`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
};

/**
 * Delete image from Cloudinary (or local) based on URL
 * @param {string} imageUrl - The URL of the image to delete
 */
export const deleteFromBoth = async (imageUrl, publicId = null) => {
    if (!imageUrl && !publicId) return;

    try {
        if (publicId) {
            await deleteFromCloudinary(publicId);
        } else if (typeof imageUrl === 'string' && imageUrl.includes('res.cloudinary.com')) {
            await deleteFromCloudinary(imageUrl);
        } else if (typeof imageUrl === 'string' && imageUrl.includes('/uploads/')) {
            // Local file path: /uploads/<folder>/<file>
            const parts = imageUrl.split('/uploads/');
            if (parts.length > 1) {
                const localPath = path.join(process.cwd(), 'server', 'public', 'uploads', parts[1].split('?')[0]);
                try {
                    await fs.promises.unlink(localPath);
                    console.log('✓ Local upload deleted:', localPath);
                } catch (fsErr) {
                    console.error('Error deleting local file:', fsErr.message || fsErr);
                }
            }
        }
    } catch (error) {
        console.error('Error deleting image:', error.message || error);
        // We log but don't throw, to allow the database deletion to proceed
    }
};
