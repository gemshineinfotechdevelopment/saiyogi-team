import multer from 'multer';

// Use memory storage so we can validate and upload buffer directly to Google Drive
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

export default upload;
