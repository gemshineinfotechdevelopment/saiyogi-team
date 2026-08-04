/**
 * Utility function to generate JWT token
 */
export const generateToken = (id, role, secret, expiresIn) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id, role }, secret, { expiresIn });
};

/**
 * Utility function to hash password
 */
export const hashPassword = async (password) => {
  const bcryptjs = require('bcryptjs');
  return await bcryptjs.hash(password, 10);
};

/**
 * Utility function to compare passwords
 */
export const comparePassword = async (password, hashedPassword) => {
  const bcryptjs = require('bcryptjs');
  return await bcryptjs.compare(password, hashedPassword);
};

/**
 * Utility function to calculate discount price
 */
export const calculateDiscountPrice = (price, hasDiscount, discountPercent) => {
  if (hasDiscount && discountPercent > 0) {
    return Math.round(price * (1 - discountPercent / 100));
  }
  return price;
};

/**
 * Utility function to calculate total with GST
 */
export const calculateTotal = (subtotal, deliveryCharge = 0) => {
  return subtotal + deliveryCharge;
};

/**
 * Paginate array
 */
export const paginate = (array, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return {
    data: array.slice(skip, skip + limit),
    pagination: {
      total: array.length,
      pages: Math.ceil(array.length / limit),
      currentPage: page,
      limit
    }
  };
};
