import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

export const signup = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existingCustomer = await Customer.findOne({ email });
    const existingUser = await User.findOne({ email });
    
    if (existingCustomer || existingUser) {
      logger.warn(`Signup failed: Email already registered (${email})`, { reqId: req.id, email });
      return next(new AppError('Email already registered', 400));
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    
    const newCustomer = new Customer({
      name,
      email,
      password: hashedPassword,
      customerType: 'WEBSITE',
      isActive: true
    });

    const savedCustomer = await newCustomer.save();

    const token = jwt.sign(
      { id: savedCustomer._id, role: 'CUSTOMER' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    logger.info(`User registered successfully (${email})`, { reqId: req.id, email, userId: savedCustomer._id, role: 'CUSTOMER' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: savedCustomer._id,
        name: savedCustomer.name,
        email: savedCustomer.email,
        role: 'CUSTOMER'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();

    // Check Users (Staff/Admins) first
    let account = await User.findOne({ email: cleanEmail });
    let isCustomer = false;

    if (!account) {
      // Check Customers
      account = await Customer.findOne({ email: cleanEmail });
      isCustomer = true;
    }

    if (!account) {
      logger.warn(`Login failed: Account not found (${email})`, { reqId: req.id, email });
      return next(new AppError('Invalid credentials', 401));
    }

    const isPasswordValid = await bcryptjs.compare(password, account.password);
    if (!isPasswordValid) {
      logger.warn(`Login failed: Invalid password (${email})`, { reqId: req.id, email });
      return next(new AppError('Invalid credentials', 401));
    }

    const role = isCustomer ? 'CUSTOMER' : account.role;

    const token = jwt.sign(
      { id: account._id, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    logger.info(`Login successful (${email})`, { reqId: req.id, email, userId: account._id, role });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: account._id,
        name: account.name,
        email: account.email,
        role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    let account;
    if (req.role === 'CUSTOMER') {
      account = await Customer.findById(req.userId).select('-password');
    } else {
      account = await User.findById(req.userId).select('-password');
    }
    
    if (!account) {
      return next(new AppError('User not found', 404));
    }

    res.json({ id: account._id, ...account.toObject() });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, deliveryAddress, billingAddress } = req.body;
    
    let updateData = { name, phone };

    if (req.role === 'CUSTOMER') {
      if (address) updateData.deliveryAddress = address; // Website might send address instead of deliveryAddress
      if (deliveryAddress) updateData.deliveryAddress = deliveryAddress;
      if (billingAddress) updateData.billingAddress = billingAddress;
      
      const updatedAccount = await Customer.findByIdAndUpdate(req.userId, updateData, { returnDocument: 'after' }).select('-password');
      res.json({
        message: 'Profile updated successfully',
        user: { id: updatedAccount._id, ...updatedAccount.toObject() }
      });
    } else {
      const updatedAccount = await User.findByIdAndUpdate(req.userId, updateData, { returnDocument: 'after' }).select('-password');
      res.json({
        message: 'Profile updated successfully',
        user: { id: updatedAccount._id, ...updatedAccount.toObject() }
      });
    }
  } catch (error) {
    next(error);
  }
};

export const customerPhoneLogin = async (req, res, next) => {
  try {
    const { phone, name } = req.body;
    if (!phone) {
      return next(new AppError('Mobile number is required', 400));
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return next(new AppError('Valid 10-digit mobile number required', 400));
    }

    let customer = await Customer.findOne({
      $or: [
        { phone: cleanPhone },
        { phone: `+91${cleanPhone}` },
        { phone: `91${cleanPhone}` },
        { phone: { $regex: cleanPhone } }
      ]
    });

    if (!customer) {
      customer = new Customer({
        name: (name || 'Customer').trim(),
        phone: cleanPhone,
        customerType: 'WEBSITE',
        isActive: true,
        sources: ['normal_login']
      });
      await customer.save();
    } else if (name && (customer.name === 'Customer' || !customer.name)) {
      customer.name = name.trim();
      await customer.save();
    }

    const token = jwt.sign(
      { id: customer._id, phone: cleanPhone, role: 'CUSTOMER' },
      process.env.JWT_SECRET || 'saiyogi_jwt_secret_key_2026',
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    logger.info(`Customer phone login successful (+91${cleanPhone})`, {
      reqId: req.id,
      phone: cleanPhone,
      customerId: customer._id
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: customer._id,
        name: customer.name,
        phone: cleanPhone,
        role: 'CUSTOMER'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyToken = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return next(new AppError('User not found or session expired', 404));
    }
    const roleUpper = String(user.role || '').toUpperCase();
    if (roleUpper !== 'SUPER ADMIN' && roleUpper !== 'ADMIN') {
      return next(new AppError('Admin access required', 403));
    }
    res.json({
      valid: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

