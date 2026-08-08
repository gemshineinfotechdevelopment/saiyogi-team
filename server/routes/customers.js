import express from 'express';
import {
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  getCustomerOrders,
  deleteCustomer,
  trackCustomerAction
} from '../controllers/customerController.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Public / User route for tracking customer action (Login, Chit Scheme, Enquiry)
router.post('/track', trackCustomerAction);

// Admin protected routes
router.get('/', auth, adminOnly, getAllCustomers);
router.get('/:id', auth, adminOnly, getCustomerById);
router.get('/:id/orders', auth, adminOnly, getCustomerOrders);

router.put('/:id', auth, adminOnly, updateCustomer);
router.delete('/:id', auth, adminOnly, deleteCustomer);

export default router;
