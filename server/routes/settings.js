import express from 'express';
import {
  getSettings,
  updateSettings,
  getSiteInfo,
  getPricingSettings
} from '../controllers/settingsController.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/public/info', getSiteInfo);
router.get('/public/pricing', getPricingSettings);

router.get('/', auth, adminOnly, getSettings);
router.put('/', auth, adminOnly, updateSettings);

export default router;
