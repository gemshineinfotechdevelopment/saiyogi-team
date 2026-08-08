import express from 'express';
import {
  getChitSchemes,
  getAdminChitSchemes,
  createChitScheme,
  updateChitScheme,
  deleteChitScheme
} from '../controllers/chitSchemeController.js';
import { auth, adminOnly } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', getChitSchemes);
router.get('/admin', auth, adminOnly, getAdminChitSchemes);

router.post('/', auth, adminOnly, upload.single('image'), createChitScheme);
router.put('/:id', auth, adminOnly, upload.single('image'), updateChitScheme);
router.delete('/:id', auth, adminOnly, deleteChitScheme);

export default router;
