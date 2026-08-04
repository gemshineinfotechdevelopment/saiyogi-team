import express from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { auth, adminOnly } from '../middleware/auth.js';
import { validate, validateCategory } from '../middleware/validation.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

router.post('/', auth, adminOnly, upload.single('image'), validateCategory, validate, createCategory);
router.put('/:id', auth, adminOnly, upload.single('image'), updateCategory);
router.delete('/:id', auth, adminOnly, deleteCategory);

export default router;
