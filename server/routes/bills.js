import express from 'express';
import {
  createBill,
  getAllBills,
  getBillById,
  cancelBill,
  getNextBillNo,
  updateBill,
  deleteBill
} from '../controllers/billController.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All billing routes require admin/staff auth
router.use(auth);

router.get('/next-no', getNextBillNo);
router.post('/', createBill);
router.get('/', getAllBills);
router.get('/:id', getBillById);
router.put('/:id', updateBill);
router.put('/:id/cancel', cancelBill);
router.delete('/:id', deleteBill);

export default router;
