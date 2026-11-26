import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import upload from '../middleware/upload.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { auth, adminOnly } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Helper to save file locally if Cloudinary fails or is unavailable
const saveLocally = (buffer, originalname, folder) => {
  const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', folder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const cleanName = `${Date.now()}_${(originalname || 'file').replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
  const filePath = path.join(uploadsDir, cleanName);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${folder}/${cleanName}`;
};

// POST /api/upload - Upload file to Cloudinary with local storage fallback
router.post('/', auth, adminOnly, (req, res, next) => {
  upload.any()(req, res, async (err) => {
    if (err) return next(err);

    try {
      const folder = req.query.folder || req.body.folder || 'admin_uploads';
      const uploadedFile = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);

      if (uploadedFile) {
        try {
          const result = await uploadToCloudinary(uploadedFile.buffer, uploadedFile.originalname, folder);
          return res.json({
            success: true,
            url: result.url,
            public_id: result.public_id
          });
        } catch (cloudErr) {
          console.warn('Cloudinary upload failed, saving locally:', cloudErr.message);
          const localUrl = saveLocally(uploadedFile.buffer, uploadedFile.originalname, folder);
          return res.json({
            success: true,
            url: localUrl,
            public_id: null
          });
        }
      }

      if (req.body.base64 || req.body.image) {
        const imageStr = req.body.base64 || req.body.image;
        if (typeof imageStr === 'string' && imageStr.startsWith('data:')) {
          const matches = imageStr.match(/^data:([a-zA-Z0-9\/\-+.]+);base64,(.+)$/);
          if (matches) {
            const mime = matches[1];
            const ext = mime.split('/')[1] || 'png';
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');
            const filename = `file_${Date.now()}.${ext}`;

            try {
              const result = await uploadToCloudinary(buffer, filename, folder);
              return res.json({
                success: true,
                url: result.url,
                public_id: result.public_id
              });
            } catch (cloudErr) {
              console.warn('Cloudinary upload failed, saving locally:', cloudErr.message);
              const localUrl = saveLocally(buffer, filename, folder);
              return res.json({
                success: true,
                url: localUrl,
                public_id: null
              });
            }
          }
        } else if (typeof imageStr === 'string' && (imageStr.startsWith('http://') || imageStr.startsWith('https://'))) {
          return res.json({
            success: true,
            url: imageStr,
            public_id: null
          });
        }
      }

      return next(new AppError('No file or base64 data provided', 400));
    } catch (error) {
      console.error('Upload route error:', error);
      next(new AppError(`Upload failed: ${error.message || error}`, 500));
    }
  });
});

export default router;
