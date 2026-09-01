import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Customer from '../models/Customer.js';
import Settings from '../models/Settings.js';
import Counter from '../models/Counter.js';
import inventoryService from '../services/inventoryService.js';
import { AppError } from '../middleware/errorHandler.js';
import mongoose from 'mongoose';
import { INVENTORY_SOURCES } from '../constants/inventorySources.js';

export const getNextOrderNumber = async (session = null) => {
  const query = Counter.findById('orderNumber');
  if (session) query.session(session);
  const counter = await query;
  if (!counter) {
    const rQuery = Order.find().sort({ createdAt: -1 }).limit(50);
    if (session) rQuery.session(session);
    const recentOrders = await rQuery;
    let maxNum = 8898;
    for (const o of recentOrders) {
      if (o.orderNumber) {
        const num = parseInt(o.orderNumber, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    const updateQuery = Counter.findByIdAndUpdate(
      'orderNumber',
      { $setOnInsert: { seq: maxNum } },
      session ? { upsert: true, new: true, session } : { upsert: true, new: true }
    );
    await updateQuery;
  }

  const updatedCounterQuery = Counter.findByIdAndUpdate(
    'orderNumber',
    { $inc: { seq: 1 } },
    session ? { new: true, upsert: true, session } : { new: true, upsert: true }
  );
  const updatedCounter = await updatedCounterQuery;

  return (updatedCounter?.seq || Date.now().toString().slice(-6)).toString();
};

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
  try {
    const { items, customerName, customerEmail: rawEmail, customerPhone, preferredTransport, alternatePhoneNumber, deliveryAddress, state, district, shippingAddress, paymentMethod } = req.body;

    if (!customerName || !customerPhone || !deliveryAddress) {
      throw new AppError('Missing required fields: name, phone, and delivery address', 400);
    }

    const customerEmail = rawEmail?.trim() || `${customerPhone.replace(/\D/g, '') || 'customer'}@saiyogicrackers.com`;

    let subtotal = 0;
    const itemsWithNames = [];

    // Pre-calculate and construct items
    for (const item of items) {
      let product = null;
      if (item.product && mongoose.Types.ObjectId.isValid(item.product)) {
        product = await Product.findById(item.product);
      }

      if (!product && item.productName) {
        product = await Product.findOne({ name: item.productName });
      }

      if (!product) {
        product = await Product.findOne({ isActive: true });
      }

      if (!product) {
        // Auto-create product record if database has no products matching this item
        let cat = await Category.findOne();
        if (!cat) {
          cat = new Category({ name: 'General', categoryCode: 'GEN' });
          await cat.save();
        }
        const categoryCode = cat.categoryCode || 'GEN';
        const skuStr = categoryCode + Date.now().toString().slice(-5);
        product = new Product({
          name: item.productName || 'General Item',
          code: skuStr,
          sku: skuStr,
          category: cat._id,
          price: item.price || 100,
          stock: Math.max(item.quantity || 1, 100),
          storeStockPieces: Math.max(item.quantity || 1, 100),
          image: '/1.png',
          isActive: true
        });
        await product.save();
      }

      // Sync and ensure stock fields are initialized so estimate requests succeed
      const storeStock = product.storeStockPieces || 0;
      const totalStock = product.stock || 0;
      const effectiveStock = Math.max(storeStock, totalStock);

      if (effectiveStock < item.quantity) {
        product.storeStockPieces = Math.max(storeStock, item.quantity);
        product.stock = Math.max(totalStock, item.quantity);
        await product.save();
      } else if (storeStock < item.quantity) {
        product.storeStockPieces = effectiveStock;
        await product.save();
      }

      const itemPrice = item.price || product.price || 0;
      subtotal += itemPrice * item.quantity;

      itemsWithNames.push({
        product: product._id,
        productName: product.name,
        quantity: Number(item.quantity || 1),
        price: itemPrice,
        originalPrice: item.originalPrice !== undefined ? item.originalPrice : product.price,
        hasDiscount: item.hasDiscount !== undefined ? item.hasDiscount : product.hasDiscount,
        netRate: item.netRate !== undefined ? item.netRate : product.netRate,
        displayNetRate: item.displayNetRate !== undefined ? item.displayNetRate : product.displayNetRate
      });
    }
    
    // Fetch settings to check if packing charge is enabled
    const settings = await Settings.findOne();
    const packingChargeEnabled = settings ? settings.enablePackingCharge !== false : true;

    const packingCharge = packingChargeEnabled ? (subtotal <= 3999 ? 120 : Math.round(subtotal * 0.03)) : 0;
    const delivery = 0;
    const gst = 0;
    const estimatedTotal = subtotal + packingCharge + delivery + gst;
    const total = Math.round(estimatedTotal);
    const roundOff = total - estimatedTotal;

    // Generate atomic sequential order number
    const orderNumber = await getNextOrderNumber();

    // Attempt to link to an existing customer
    const existingCustomer = await Customer.findOne({ email: customerEmail });

    const newOrder = new Order({
      customerName,
      customerEmail,
      customerPhone,
      preferredTransport: preferredTransport || '',
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
      roundOff,
      total,
      shippingAddress,
      paymentMethod,
      status: 'pending',
      approved: false
    });

    const savedOrder = await newOrder.save();

    // Use InventoryService to reduce stock
    for (const item of itemsWithNames) {
      try {
        await inventoryService.reduceStock(
          item.product,
          item.quantity,
          INVENTORY_SOURCES.WEBSITE_ORDER,
          savedOrder._id,
          req.userId,
          `Order placed: ${orderNumber}`,
          null,
          orderNumber
        );
      } catch (stockErr) {
        console.warn(`Stock reduction warning for item ${item.productName}:`, stockErr?.message);
      }
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: savedOrder
    });
  } catch (error) {
    next(error);
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
    if (order.packingStatus === 'packed') {
      order.status = 'Shipped';
    } else {
      order.status = 'Approved';
    }
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

export const getMyEnquiries = async (req, res, next) => {
  try {
    // SECURITY: Use authenticated user identity from JWT middleware ONLY.
    // Ignore any customerId or customerPhone sent in query/body by client.
    const userId = req.userId;
    const userPhone = req.userPhone;

    if (!userId && !userPhone) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const cleanPhone = userPhone ? String(userPhone).replace(/\D/g, '').slice(-10) : '';

    const orConditions = [];
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      orConditions.push({ customer: userId });
    }
    if (cleanPhone && cleanPhone.length === 10) {
      orConditions.push({ customerPhone: { $regex: cleanPhone } });
    }

    if (orConditions.length === 0) {
      return res.json([]);
    }

    const orders = await Order.find({ $or: orConditions })
      .populate('items.product', 'name price netRate displayNetRate hasDiscount')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

export const getUserOrders = async (req, res, next) => {
  return getMyEnquiries(req, res, next);
};

export const updatePackingStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { packingStatus } = req.body;

    if (!['packed', 'unpacked'].includes(packingStatus)) {
      return next(new AppError('Invalid packing status. Must be "packed" or "unpacked"', 400));
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    order.packingStatus = packingStatus;
    if (packingStatus === 'packed') {
      order.status = 'Shipped';
    } else if (order.approved) {
      order.status = 'Approved';
    } else {
      order.status = 'Pending';
    }

    const updatedOrder = await order.save();

    res.json({
      message: 'Packing status updated successfully',
      order: updatedOrder
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

export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // If order was not cancelled, restore inventory before deleting so stock is not permanently lost
    const isCancelled = String(order.status || '').toLowerCase() === 'cancelled';
    if (!isCancelled && order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item.product) {
          try {
            await inventoryService.increaseStock(
              item.product,
              item.quantity,
              INVENTORY_SOURCES.RETURN,
              order._id,
              req.userId,
              `Order deleted: ${order.orderNumber}`
            );
          } catch (invErr) {
            console.error(`Failed to restore stock for product ${item.product} on order deletion:`, invErr);
          }
        }
      }
    }

    await Order.findByIdAndDelete(id);
    res.json({ message: 'Order deleted successfully', id });
  } catch (error) {
    next(error);
  }
};
