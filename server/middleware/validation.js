import { body, validationResult } from 'express-validator';
import { AppError } from './errorHandler.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg
    }));
    return next(new AppError(formattedErrors[0].message, 400));
  }
  next();
};

// Product Validation
export const validateProduct = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
  body('brand').optional().isString(),
  body('description').optional().isString(),
];

// Order Validation
export const validateOrder = [
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('customerEmail').isEmail().withMessage('Invalid email address'),
  body('customerName').notEmpty().withMessage('Customer name is required'),
];

// Category Validation
export const validateCategory = [
  body('name').notEmpty().withMessage('Category name is required'),
];

// Auth Validation
export const validateSignUp = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required'),
];

export const validateLogin = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];
