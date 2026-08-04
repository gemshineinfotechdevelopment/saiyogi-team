import express from 'express';
import { signup, login, getProfile, updateProfile } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import { validate, validateSignUp, validateLogin } from '../middleware/validation.js';

const router = express.Router();

router.post('/signup', validateSignUp, validate, signup);
router.post('/login', validateLogin, validate, login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

export default router;
