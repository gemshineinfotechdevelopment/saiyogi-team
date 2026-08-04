import express from 'express';
import {
  getSalesReport,
  getLowStockReport,
  getTopSellingProducts,
  getInventoryMovement,
  getCustomerPurchaseReport,
  getDashboardReport
} from '../controllers/reportController.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/dashboard', getDashboardReport);
router.get('/sales', getSalesReport);
router.get('/low-stock', getLowStockReport);
router.get('/top-selling', getTopSellingProducts);
router.get('/inventory-movement', getInventoryMovement);
router.get('/customer-purchases', getCustomerPurchaseReport);

export default router;
