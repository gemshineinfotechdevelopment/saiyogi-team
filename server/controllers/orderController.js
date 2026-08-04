import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Settings from '../models/Settings.js';
import inventoryService from '../services/inventoryService.js';
import { AppError } from '../middleware/errorHandler.js';
import mongoose from 'mongoose';
import { INVENTORY_SOURCES } from '../constants/inventorySources.js';

export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('items.product', 'name price netRate displayNetRate hasDiscount').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product', 'name price netRate displayNetRate hasDiscount');
    if (!order) {
      return next(new AppError('Order not found', 404));
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { items, customerName, customerEmail, customerPhone, alternatePhoneNumber, deliveryAddress, state, district, shippingAddress, paymentMethod } = req.body;

    if (!customerName || !customerPhone || !deliveryAddress) {
      throw new AppError('Missing required fields: name, phone, and delivery address', 400);
    }

    let subtotal = 0;
    const itemsWithNames = [];

    // Pre-calculate and construct items
    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        throw new AppError(`Product ${item.product} not found`, 404);
      }

      // Quick sanity check before hitting reduceStock (which does atomic check)
      if (product.storeStockPieces < item.quantity) {
        throw new AppError(`Insufficient stock for ${product.name}. Available: ${product.storeStockPieces}`, 400);
      }

      const itemPrice = item.price || product.price || 0;
      subtotal += itemPrice * item.quantity;

      itemsWithNames.push({
        ...item,
        productName: product.name,
        originalPrice: item.originalPrice !== undefined ? item.originalPrice : product.price,
        hasDiscount: item.hasDiscount !== undefined ? item.hasDiscount : product.hasDiscount,
        netRate: item.netRate !== undefined ? item.netRate : product.netRate,
        displayNetRate: item.displayNetRate !== undefined ? item.displayNetRate : product.displayNetRate
      });
    }
    
    // Fetch settings to check if packing charge is enabled
    const settings = await Settings.findOne().session(session);
    const packingChargeEnabled = settings ? settings.enablePackingCharge !== false : true;

    const packingCharge = packingChargeEnabled ? Math.round(subtotal * 0.03) : 0;
    const delivery = 0;
    const gst = 0;
    const total = subtotal + packingCharge;

    const count = await Order.countDocuments().session(session);
    const orderNumber = (count + 1).toString().padStart(5, '0');

    // Attempt to link to an existing customer
    const existingCustomer = await Customer.findOne({ email: customerEmail }).session(session);

    const newOrder = new Order({
      customerName,
      customerEmail,
      customerPhone,
      alternatePhoneNumber,
      customer: existingCustomer ? existingCustomer._id : null,
      deliveryAddress: {
        fullAddress: deliveryAddress,
        street: deliveryAddress,
        state: state || '',
        district: district || '',
      },
      orderNumber,
      items: itemsWithNames,
      subtotal,
      packingCharge,
      gst,
      delivery,
      total,
      shippingAddress,
      paymentMethod,
      status: 'pending',
      approved: false
    });

    const savedOrder = await newOrder.save({ session });

    // Use InventoryService to reduce stock inside the transaction
    for (const item of items) {
      await inventoryService.reduceStock(
        item.product,
        item.quantity,
        INVENTORY_SOURCES.WEBSITE_ORDER,
        savedOrder._id,
        req.userId,
        `Order placed: ${orderNumber}`,
        session,
        orderNumber
      );
    }

    await session.commitTransaction();

    res.status(201).json({
      message: 'Order created successfully',
      order: savedOrder
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, trackingNumber, notes } = req.body;

    const updateData = { status };
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (notes) updateData.notes = notes;

    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });

    if (!updatedOrder) {
      return next(new AppError('Order not found', 404));
    }

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

export const approveOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    order.approved = true;
    const updatedOrder = await order.save();

    let customer = await Customer.findOne({ email: order.customerEmail });

    if (customer) {
      customer.name = order.customerName;
      customer.phone = order.customerPhone;
      customer.alternatePhone = order.alternatePhoneNumber;
      customer.deliveryAddress = order.deliveryAddress;
      await customer.save();
    } else {
      // Create new customer if not exists
      customer = new Customer({
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        alternatePhone: order.alternatePhoneNumber,
        deliveryAddress: order.deliveryAddress,
        customerType: 'WEBSITE'
      });
      await customer.save();
      updatedOrder.customer = customer._id;
      await updatedOrder.save();
    }

    res.json({
      message: 'Order approved and customer updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    if (order.status === 'delivered') {
      return next(new AppError('Cannot cancel delivered order', 400));
    }

    if (order.status !== 'cancelled') {
      // Restore stock using InventoryService
      for (const item of order.items || []) {
        await inventoryService.increaseStock(
          item.product,
          item.quantity,
          INVENTORY_SOURCES.RETURN, // or order cancellation
          order._id,
          req.userId,
          `Order cancelled: ${order.orderNumber}`
        );
      }

      order.status = 'cancelled';
      await order.save();
    }

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

export const getUserOrders = async (req, res, next) => {
  try {
    const userEmail = req.userEmail; // needs to be set by auth middleware if applicable
    let query = {};
    if (userEmail) {
      query = { customerEmail: userEmail };
    } else if (req.userId) {
      query = { customer: req.userId };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

export const updatePackingStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { packingStatus } = req.body;

    if (!['packed', 'unpacked'].includes(packingStatus)) {
      return next(new AppError('Invalid packing status. Must be "packed" or "unpacked"', 400));
    }

    const order = await Order.findByIdAndUpdate(orderId, { packingStatus }, { returnDocument: 'after' });
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    res.json({
      message: 'Packing status updated successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

export const updateHoldDays = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { holdDays } = req.body;

    const days = parseInt(holdDays, 10);
    if (isNaN(days) || days < 0) {
      return next(new AppError('Invalid hold days. Must be a non-negative number.', 400));
    }

    const order = await Order.findByIdAndUpdate(orderId, { holdDays: days }, { returnDocument: 'after' });
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    res.json({
      message: 'Hold days updated successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};
