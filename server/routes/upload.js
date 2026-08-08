import express from 'express';
import upload from '../middleware/upload.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { auth, adminOnly } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// POST /api/upload - Upload single file to Cloudinary
router.post('/', auth, adminOnly, upload.single('image'), async (req, res, next) => {
  try {
    const folder = req.query.folder || req.body.folder || 'admin_uploads';

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.originalname, folder);
      return res.json({
        success: true,
        url: result.url,
        public_id: result.public_id
      });
    }

    if (req.body.base64 || req.body.image) {
      const imageStr = req.body.base64 || req.body.image;
      if (typeof imageStr === 'string' && imageStr.startsWith('data:image')) {
        const matches = imageStr.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] || 'png';
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const filename = `image_${Date.now()}.${ext}`;
          
          const result = await uploadToCloudinary(buffer, filename, folder);
          return res.json({
            success: true,
            url: result.url,
            public_id: result.public_id
          });
        }
      } else if (typeof imageStr === 'string' && (imageStr.startsWith('http://') || imageStr.startsWith('https://'))) {
        return res.json({
          success: true,
          url: imageStr,
          public_id: null
        });
      }
    }

    return next(new AppError('No image file or base64 data provided', 400));
  } catch (error) {
    console.error('Upload route error:', error);
    next(new AppError(`Cloudinary upload failed: ${error.message || error}`, 500));
  }
});

export default router;
