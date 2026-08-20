import express from 'express';
import multer from 'multer';
import {
  startBulkImport,
  getBulkImportStatus,
  downloadTemplate
} from '../controllers/bulkImportController.js';
import { auth, adminOnly } from '../middleware/auth.js';

const zipStorage = multer.memoryStorage();
const zipUpload = multer({
  storage: zipStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB file limit for ZIP files
});

const router = express.Router();

router.get('/template', downloadTemplate);
router.get('/status/:jobId', auth, adminOnly, getBulkImportStatus);
router.post('/', auth, adminOnly, zipUpload.single('file'), startBulkImport);

export default router;
