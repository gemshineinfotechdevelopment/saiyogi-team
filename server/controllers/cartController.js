import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { AppError } from '../middleware/errorHandler.js';

const computeCartTotals = (cart) => {
  let totalItems = 0;
  let totalPrice = 0;
  
  cart.items.forEach(item => {
    totalItems += item.quantity;
    if (item.product && item.product.price !== undefined) {
      totalPrice += item.quantity * item.product.price;
    }
  });
  
  cart.totalItems = totalItems;
  cart.totalPrice = totalPrice;
};

export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.userId }).populate('items.product');

    if (!cart) {
      cart = await Cart.create({ user: req.userId, items: [], totalItems: 0, totalPrice: 0 });
    } else {
      const originalLength = cart.items.length;
      cart.items = cart.items.filter(item => item.product != null);
      if (cart.items.length !== originalLength) {
        computeCartTotals(cart);
        await cart.save();
      }
    }

    res.json(cart);
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    if ((product.stock || 0) < quantity) {
      return next(new AppError('Insufficient stock', 400));
    }

    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }

    const existingItem = cart.items.find(item => item.product.toString() === productId);
    if (existingItem) {
      existingItem.quantity += parseInt(quantity);
    } else {
      cart.items.push({ product: productId, quantity: parseInt(quantity) });
    }

    await cart.populate('items.product');
    cart.items = cart.items.filter(item => item.product != null);
    computeCartTotals(cart);
    await cart.save();

    res.json({ message: 'Item added to cart', cart });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter(item => item.product.toString() !== productId);
    } else {
      const item = cart.items.find(i => i.product.toString() === productId);
      if (item) {
        item.quantity = parseInt(quantity);
      }
    }

    await cart.populate('items.product');
    cart.items = cart.items.filter(item => item.product != null);
    computeCartTotals(cart);
    await cart.save();

    res.json({ message: 'Cart updated', cart });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);

    await cart.populate('items.product');
    cart.items = cart.items.filter(item => item.product != null);
    computeCartTotals(cart);
    await cart.save();

    res.json({ message: 'Item removed from cart', cart });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.userId });
    if (cart) {
      cart.items = [];
      cart.totalItems = 0;
      cart.totalPrice = 0;
      await cart.save();
    }
    
    res.json({ message: 'Cart cleared', cart: cart || { user: req.userId, items: [], totalItems: 0, totalPrice: 0 } });
  } catch (error) {
    next(error);
  }
};
