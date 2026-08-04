import express from 'express';
import {
  getInventory,
  getDashboardStats,
  transferStock,
  addGodownStock,
  getInventoryByProduct,
  addStock,
  adjustStock,
  getLowStockProducts,
  getInventoryMovements,
  adjustCustomStock,
  getLedger
} from '../controllers/inventoryController.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// New ERP Endpoints
router.get('/dashboard', auth, adminOnly, getDashboardStats);
router.post('/transfer', auth, adminOnly, transferStock);
router.post('/godown/add', auth, adminOnly, addGodownStock);
router.post('/adjust-custom', auth, adminOnly, adjustCustomStock);
router.get('/ledger', auth, adminOnly, getLedger);

// Legacy/Standard Endpoints
router.get('/', auth, adminOnly, getInventory);
router.get('/low-stock', auth, adminOnly, getLowStockProducts);
router.get('/product/:productId', auth, adminOnly, getInventoryByProduct);
router.get('/:productId/movements', auth, adminOnly, getInventoryMovements);

router.post('/add-stock', auth, adminOnly, addStock);
router.post('/adjust-stock', auth, adminOnly, adjustStock);

export default router;
