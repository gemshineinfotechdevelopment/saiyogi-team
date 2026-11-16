import express from 'express';
import {
  submitChitSubscription,
  getChitSubscriptions,
  getChitSubscriptionById,
  updateChitSubscriptionStatus,
  approveChitSubscription,
  rejectChitSubscription,
  recordSchemePayment,
  markMonthlyPaymentRead,
  updateMonthPaymentStatus,
  deleteChitSubscription
} from '../controllers/chitSubscriptionController.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/', submitChitSubscription);
router.get('/', getChitSubscriptions);
router.get('/:id', getChitSubscriptionById);

// Payment Recording with Auto-generated Unique Receipt Number
router.post('/:id/schemes/:schemeId/payment', auth, adminOnly, recordSchemePayment);
router.post('/:id/payment', auth, adminOnly, recordSchemePayment);

router.put('/:id/status', auth, adminOnly, updateChitSubscriptionStatus);
router.patch('/:id/status', auth, adminOnly, updateChitSubscriptionStatus);
router.put('/:id/approve', auth, adminOnly, approveChitSubscription);
router.put('/:id/reject', auth, adminOnly, rejectChitSubscription);
router.put('/:id/mark-read', auth, adminOnly, markMonthlyPaymentRead);
router.post('/:id/mark-read', auth, adminOnly, markMonthlyPaymentRead);
router.put('/:id/month-status', auth, adminOnly, updateMonthPaymentStatus);
router.delete('/:id', auth, adminOnly, deleteChitSubscription);

export default router;
