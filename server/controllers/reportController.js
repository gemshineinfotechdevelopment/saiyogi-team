import InventoryTransaction from '../models/InventoryTransaction.js';
import Order from '../models/Order.js';
import Bill from '../models/Bill.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import { INVENTORY_SOURCES } from '../constants/inventorySources.js';

export const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    let sourceMatch = {};
    if (type === 'website') sourceMatch = { source: INVENTORY_SOURCES.WEBSITE_ORDER };
    else if (type === 'retail') sourceMatch = { source: INVENTORY_SOURCES.RETAIL_BILL };
    else if (type === 'wholesale') sourceMatch = { source: INVENTORY_SOURCES.WHOLESALE_BILL };
    else if (type === 'netrate') sourceMatch = { source: INVENTORY_SOURCES.NETRATE_BILL };

    const matchStage = {
      type: 'OUT',
      ...dateQuery,
      ...sourceMatch
    };

    const sales = await InventoryTransaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
            source: "$source"
          },
          totalQuantitySold: { $sum: "$quantity" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } }
    ]);

    res.json(sales);
  } catch (error) {
    next(error);
  }
};

export const getLowStockReport = async (req, res, next) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ["$stock", "$minimumStock"] },
      isActive: true
    }).select('name code sku stock minimumStock category');

    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const getTopSellingProducts = async (req, res, next) => {
  try {
    const topProducts = await InventoryTransaction.aggregate([
      { $match: { type: 'OUT' } },
      {
        $group: {
          _id: "$product",
          totalQuantitySold: { $sum: "$quantity" }
        }
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          name: "$productDetails.name",
          code: "$productDetails.code",
          totalQuantitySold: 1
        }
      }
    ]);

    res.json(topProducts);
  } catch (error) {
    next(error);
  }
};

export const getInventoryMovement = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    let matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const movements = await InventoryTransaction.find(matchStage)
      .populate('product', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(100); // Pagination could be added

    res.json(movements);
  } catch (error) {
    next(error);
  }
};

export const getCustomerPurchaseReport = async (req, res, next) => {
  try {
    const { customerId } = req.query;
    
    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    const orders = await Order.find({ customer: customerId }).select('orderNumber total createdAt status items');
    const bills = await Bill.find({ customer: customerId }).select('billNo totalAmount date status items');

    res.json({ orders, bills });
  } catch (error) {
    next(error);
  }
};


export const getDashboardReport = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments({});
    
    // Calculate total sales from all orders and bills
    const orders = await Order.find({});
    const orderSales = orders.reduce((sum, o) => sum + (Number(o.subtotal) || 0) + (Number(o.packingCharge) || 0), 0);
    
    const bills = await Bill.find({ status: 'completed' });
    const billSales = bills.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    
    const openBills = await Bill.countDocuments({ status: { $in: ['active', 'held'] } });
    const inventoryItems = await Product.countDocuments({ isActive: true });

    // Real sales by category from inventory transactions
    const categoryAgg = await InventoryTransaction.aggregate([
      { $match: { type: 'OUT' } },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'prod'
        }
      },
      { $unwind: '$prod' },
      {
        $lookup: {
          from: 'categories',
          localField: 'prod.category',
          foreignField: '_id',
          as: 'cat'
        }
      },
      { $unwind: '$cat' },
      {
        $group: {
          _id: '$cat._id',
          name: { $first: '$cat.name' },
          value: { $sum: '$quantity' }
        }
      },
      { $sort: { value: -1 } },
      { $limit: 8 }
    ]);

    const salesByCategory = categoryAgg.map(c => ({ name: c.name, value: c.value }));

    // Real monthly trends — last 6 months from orders
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyOrderAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          sales: { $sum: { $add: ['$subtotal', { $ifNull: ['$packingCharge', 0] }] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyTrends = monthlyOrderAgg.map(m => ({
      month: `${MONTH_NAMES[m._id.month - 1]} ${String(m._id.year).slice(2)}`,
      sales: Math.round(m.sales)
    }));

    res.json({
      totalSales: orderSales + billSales,
      totalOrders,
      openBills,
      inventoryItems,
      salesByCategory,
      monthlyTrends
    });
  } catch (error) {
    next(error);
  }
};
