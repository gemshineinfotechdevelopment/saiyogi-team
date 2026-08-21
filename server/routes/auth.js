import express from 'express';
import { signup, login, customerPhoneLogin, getProfile, updateProfile, verifyToken } from '../controllers/authController.js';
import { auth, adminOnly } from '../middleware/auth.js';
import { validate, validateSignUp, validateLogin } from '../middleware/validation.js';

const router = express.Router();

router.post('/signup', validateSignUp, validate, signup);
router.post('/login', validateLogin, validate, login);
router.post('/customer-login', customerPhoneLogin);
router.get('/verify', auth, adminOnly, verifyToken);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

export default router;
