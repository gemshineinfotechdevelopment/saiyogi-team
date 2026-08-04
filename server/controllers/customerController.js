import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAllCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find({ isActive: true });

    // Populate order count and total spent (basic implementation, can be optimized with aggregation later)
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        // Assume Order model uses customer (ObjectId) now, or customerEmail if legacy
        const orders = await Order.find({ 
          $or: [{ customer: customer._id }, { customerEmail: customer.email }] 
        });
        
        const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);

        return {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || '',
          customerType: customer.customerType,
          orderCount: orders.length,
          totalSpent,
          createdAt: customer.createdAt
        };
      })
    );

    res.json(customersWithStats);
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    const orders = await Order.find({ 
      $or: [{ customer: customer._id }, { customerEmail: customer.email }] 
    }).sort('-createdAt');

    const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    res.json({
      _id: customer._id,
      ...customer.toObject(),
      orderCount: orders.length,
      totalSpent,
      orders
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, customerType, deliveryAddress, billingAddress, gstNo, aadharNo, reference1, referenceName } = req.body;

    const newCustomer = new Customer({
      name,
      email,
      phone,
      customerType: customerType || 'WEBSITE',
      deliveryAddress,
      billingAddress,
      gstNo,
      aadharNo,
      reference1,
      referenceName,
      isActive: true
    });

    const savedCustomer = await newCustomer.save();

    res.status(201).json({
      message: 'Customer created successfully',
      customer: savedCustomer
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { phone, address, customerType, deliveryAddress, billingAddress, gstNo, aadharNo, reference1, referenceName } = req.body;

    const updateData = {};
    if (phone) updateData.phone = phone;
    if (address) updateData.deliveryAddress = address; // backwards compatibility
    if (deliveryAddress) updateData.deliveryAddress = deliveryAddress;
    if (billingAddress) updateData.billingAddress = billingAddress;
    if (customerType) updateData.customerType = customerType;
    if (gstNo !== undefined) updateData.gstNo = gstNo;
    if (aadharNo !== undefined) updateData.aadharNo = aadharNo;
    if (reference1 !== undefined) updateData.reference1 = reference1;
    if (referenceName !== undefined) updateData.referenceName = referenceName;

    const updatedCustomer = await Customer.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });

    if (!updatedCustomer) {
      return next(new AppError('Customer not found', 404));
    }

    res.json({
      message: 'Customer updated',
      customer: updatedCustomer
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerOrders = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    const orders = await Order.find({ 
      $or: [{ customer: customer._id }, { customerEmail: customer.email }] 
    }).sort('-createdAt');

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await Customer.findByIdAndDelete(id);
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};
