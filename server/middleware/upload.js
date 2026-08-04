import multer from 'multer';

// Use memory storage so we can validate and upload buffer directly to Google Drive
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

export default upload;
