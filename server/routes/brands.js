import express from 'express';
import { getBrands, createBrand, updateBrand, deleteBrand } from '../controllers/brandController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getBrands);
router.post('/', auth, authorize('admin', 'SUPER ADMIN', 'ADMIN'), createBrand);
router.put('/:id', auth, authorize('admin', 'SUPER ADMIN', 'ADMIN'), updateBrand);
router.delete('/:id', auth, authorize('admin', 'SUPER ADMIN', 'ADMIN'), deleteBrand);

export default router;
