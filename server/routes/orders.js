import express from 'express';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getUserOrders,
  approveOrder,
  updatePackingStatus,
  updateHoldDays
} from '../controllers/orderController.js';
import { auth, adminOnly } from '../middleware/auth.js';
import { validate, validateOrder } from '../middleware/validation.js';

const router = express.Router();

router.post('/', validateOrder, validate, createOrder);
router.get('/user/my-orders', auth, getUserOrders);

router.get('/', auth, adminOnly, getAllOrders);
router.get('/:id', auth, adminOnly, getOrderById);
router.put('/:id/status', auth, adminOnly, updateOrderStatus);
router.put('/:id/cancel', auth, adminOnly, cancelOrder);
router.put('/:orderId/approve', auth, adminOnly, approveOrder);
router.put('/:orderId/packing-status', auth, adminOnly, updatePackingStatus);
router.put('/:orderId/hold-days', auth, adminOnly, updateHoldDays);

export default router;
