import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import { AppError } from '../middleware/errorHandler.js';

export const trackCustomerAction = async (req, res, next) => {
  try {
    const { phone, name, source, enquiry, deliveryAddress } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    if (!cleanPhone) {
      return res.status(400).json({ error: 'Valid 10-digit mobile number required' });
    }

    let customer = await Customer.findOne({ phone: cleanPhone });

    if (!customer) {
      customer = new Customer({
        name: name || 'Customer',
        phone: cleanPhone,
        sources: source ? [source] : ['normal_login'],
        productEnquiries: []
      });
    } else {
      if (name && (customer.name === 'Customer' || !customer.name)) {
        customer.name = name;
      }
    }

    if (source === 'chit_scheme') {
      customer.sources = customer.sources.filter(s => s !== 'normal_login');
      if (!customer.sources.includes('chit_scheme')) {
        customer.sources.push('chit_scheme');
      }
    }

    if ((source === 'product_enquiry' || (enquiry && enquiry.productName))) {
      customer.sources = customer.sources.filter(s => s !== 'normal_login');
      if (!customer.sources.includes('product_enquiry')) {
        customer.sources.push('product_enquiry');
      }
      if (enquiry && enquiry.productName) {
        customer.productEnquiries.push({
          productName: enquiry.productName,
          amount: Number(enquiry.amount) || 0,
          status: enquiry.status || 'New',
          enquiryDate: enquiry.enquiryDate || new Date(),
          items: enquiry.items || []
        });
      }
    }

    if (deliveryAddress) {
      if (typeof deliveryAddress === 'object') {
        customer.deliveryAddress = deliveryAddress;
      } else {
        customer.deliveryAddress = { fullAddress: deliveryAddress };
      }
    }

    await customer.save();

    res.json({
      message: 'Customer action tracked successfully',
      customer
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCustomers = async (req, res, next) => {
  try {
    const dbCustomers = await Customer.find({ isActive: true });
    const dbOrders = await Order.find({});

    const customerMap = new Map();

    const getEntry = (rawPhone, rawName, rawEmail) => {
      const cleanPhone = String(rawPhone || '').replace(/\D/g, '').slice(-10);
      const key = cleanPhone || String(rawEmail || '').toLowerCase().trim();
      if (!key) return null;

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: key,
          name: rawName || 'Customer',
          email: rawEmail || '',
          phone: cleanPhone || rawPhone || '',
          alternatePhone: '',
          deliveryAddress: '',
          state: '',
          district: '',
          sources: new Set(),
          productEnquiries: [],
          approvedOrders: [],
          createdAt: new Date().toISOString()
        });
      }
      const entry = customerMap.get(key);
      if (rawName && (entry.name === 'Customer' || !entry.name)) {
        entry.name = rawName;
      }
      if (rawEmail && !entry.email) {
        entry.email = rawEmail;
      }
      return entry;
    };

    // 1. Populate from Customer model
    for (const c of dbCustomers) {
      const entry = getEntry(c.phone, c.name, c.email);
      if (!entry) continue;
      entry._id = c._id;
      entry.alternatePhone = c.alternatePhone || entry.alternatePhone;
      entry.deliveryAddress = c.deliveryAddress?.fullAddress || (typeof c.deliveryAddress === 'string' ? c.deliveryAddress : entry.deliveryAddress);
      entry.state = c.deliveryAddress?.state || c.state || entry.state;
      entry.district = c.deliveryAddress?.district || c.district || entry.district;
      entry.createdAt = c.createdAt || entry.createdAt;

      (c.sources || ['normal_login']).forEach((src) => entry.sources.add(src));

      if (Array.isArray(c.productEnquiries)) {
        c.productEnquiries.forEach((pe) => {
          entry.productEnquiries.push({
            id: pe._id || pe.id || String(Math.random()),
            productName: pe.productName || 'Enquiry Item',
            amount: Number(pe.amount) || 0,
            status: pe.status || 'New',
            enquiryDate: pe.enquiryDate ? new Date(pe.enquiryDate).toISOString() : new Date().toISOString()
          });
        });
      }
    }

    // 2. Populate from Order model
    for (const o of dbOrders) {
      const entry = getEntry(o.customerPhone, o.customerName, o.customerEmail);
      if (!entry) continue;

      entry.sources.add('product_enquiry');

      if (o.deliveryAddress) {
        if (!entry.deliveryAddress) {
          entry.deliveryAddress = o.deliveryAddress.fullAddress || (typeof o.deliveryAddress === 'string' ? o.deliveryAddress : '');
        }
        if (!entry.state) entry.state = o.deliveryAddress.state || o.state || '';
        if (!entry.district) entry.district = o.deliveryAddress.district || o.district || '';
      }

      // Check if order is approved or just enquiry/unapproved
      if (o.approved) {
        entry.approvedOrders.push(o);
      } else {
        // Unapproved order counts as Product Enquiry if not already captured
        const itemsSummary = Array.isArray(o.items) && o.items.length > 0
          ? o.items.map(i => i.productName || i.product || 'Fireworks').join(', ')
          : 'Product Enquiry';
        const totalAmt = Number(o.total || o.subtotal || 0);

        const exists = entry.productEnquiries.some(pe => pe.id === String(o._id));
        if (!exists) {
          entry.productEnquiries.push({
            id: String(o._id),
            productName: itemsSummary,
            amount: totalAmt,
            status: o.status || 'New',
            enquiryDate: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString()
          });
        }
      }
    }

    // 3. Format final list
    const result = Array.from(customerMap.values()).map((entry) => {
      // If customer has chit_scheme or product_enquiry, remove normal_login
      if (entry.sources.has('chit_scheme') || entry.sources.has('product_enquiry')) {
        entry.sources.delete('normal_login');
      }

      const sourcesList = Array.from(entry.sources);
      if (sourcesList.length === 0) {
        sourcesList.push('normal_login');
      }

      const totalOrders = entry.approvedOrders.length;
      let totalSpent = 0;
      let lastOrderDate = null;

      if (totalOrders > 0) {
        totalSpent = entry.approvedOrders.reduce((sum, ord) => {
          return sum + (Number(ord.total) || (Number(ord.subtotal) + (Number(ord.packingCharge) || 0)));
        }, 0);

        const dates = entry.approvedOrders
          .map(ord => ord.createdAt ? new Date(ord.createdAt).getTime() : 0)
          .filter(d => d > 0);
        if (dates.length > 0) {
          lastOrderDate = new Date(Math.max(...dates)).toISOString();
        }
      }

      return {
        _id: entry._id || entry.id,
        name: entry.name,
        email: entry.email,
        phone: entry.phone,
        alternatePhone: entry.alternatePhone,
        deliveryAddress: entry.deliveryAddress,
        state: entry.state,
        district: entry.district,
        sources: sourcesList,
        productEnquiries: entry.productEnquiries,
        totalOrders,
        totalSpent, // strictly from approved orders
        lastOrderDate, // strictly from approved orders
        purchases: entry.approvedOrders,
        createdAt: entry.createdAt
      };
    });

    res.json(result);
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
      $or: [{ customer: customer._id }, { customerEmail: customer.email }, { customerPhone: customer.phone }] 
    }).sort('-createdAt');

    const approvedOrders = orders.filter(o => o.approved);
    const totalSpent = approvedOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    res.json({
      _id: customer._id,
      ...customer.toObject(),
      orderCount: approvedOrders.length,
      totalSpent,
      orders
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, customerType, deliveryAddress, billingAddress, gstNo, aadharNo, reference1, referenceName, sources } = req.body;

    const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';

    const newCustomer = new Customer({
      name,
      email,
      phone: cleanPhone,
      customerType: customerType || 'WEBSITE',
      deliveryAddress,
      billingAddress,
      gstNo,
      aadharNo,
      reference1,
      referenceName,
      sources: sources || ['normal_login'],
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
    const { phone, address, customerType, deliveryAddress, billingAddress, gstNo, aadharNo, reference1, referenceName, sources } = req.body;

    const updateData = {};
    if (phone) updateData.phone = String(phone).replace(/\D/g, '').slice(-10);
    if (address) updateData.deliveryAddress = address;
    if (deliveryAddress) updateData.deliveryAddress = deliveryAddress;
    if (billingAddress) updateData.billingAddress = billingAddress;
    if (customerType) updateData.customerType = customerType;
    if (sources) updateData.sources = sources;
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
      $or: [{ customer: customer._id }, { customerEmail: customer.email }, { customerPhone: customer.phone }] 
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
