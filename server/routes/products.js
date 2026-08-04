import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory
} from '../controllers/productController.js';
import { auth, adminOnly, optionalAuth } from '../middleware/auth.js';
import { validate, validateProduct } from '../middleware/validation.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', optionalAuth, getAllProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);

router.post('/', auth, adminOnly, upload.single('image'), validateProduct, validate, createProduct);
router.put('/:id', auth, adminOnly, upload.single('image'), updateProduct);
router.delete('/:id', auth, adminOnly, deleteProduct);

export default router;
