import express from 'express';
import { getBrands, getNextBrandId, createBrand, updateBrand, deleteBrand } from '../controllers/brandController.js';
import { auth, adminOnly } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', getBrands);
router.get('/next-id', getNextBrandId);
router.post('/', auth, adminOnly, upload.single('logo'), createBrand);
router.put('/:id', auth, adminOnly, upload.single('logo'), updateBrand);
router.delete('/:id', auth, adminOnly, deleteBrand);

export default router;
