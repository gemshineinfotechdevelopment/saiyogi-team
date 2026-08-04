import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new AppError('No token provided', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.role = decoded.role;
    next();
  } catch (error) {
    next(new AppError('Invalid token', 401));
  }
};

export const adminOnly = (req, res, next) => {
  if (req.role !== 'SUPER ADMIN' && req.role !== 'ADMIN') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};

export const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
      req.role = decoded.role;
    } catch (error) {
      // Token invalid but not required - continue
    }
  }
  next();
};
