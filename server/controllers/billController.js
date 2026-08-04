import Bill from '../models/Bill.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import inventoryService from '../services/inventoryService.js';
import { AppError } from '../middleware/errorHandler.js';
import mongoose from 'mongoose';
import { INVENTORY_SOURCES } from '../constants/inventorySources.js';

// Get next bill number
export const getNextBillNo = async (req, res, next) => {
  try {
    const { billType } = req.query;
    if (!billType) {
      return next(new AppError('billType query parameter is required', 400));
    }

    const lastBill = await Bill.findOne({ billType }).sort({ createdAt: -1 });
    let lastNumber = 0;
    if (lastBill && lastBill.billNo) {
      const parts = lastBill.billNo.split('-');
      if (parts.length === 2 && !isNaN(parseInt(parts[1], 10))) {
        lastNumber = parseInt(parts[1], 10);
      }
    }
    
    const billTypeStr = String(billType);
    const prefix = billTypeStr.substring(0, 1).toUpperCase(); // R, W, N, T
    const nextNo = `${prefix}-${(lastNumber + 1).toString().padStart(5, '0')}`;
    
    res.json({ nextBillNo: nextNo });
  } catch (error) {
    next(error);
  }
};

export const createBill = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const billData = req.body;
    
    if (!billData.billType) {
      throw new AppError('billType is required', 400);
    }

    // Try to associate with an existing customer
    let customerId = billData.customer;
    if (!customerId && billData.mobNo) {
      const customer = await Customer.findOne({ phone: billData.mobNo }).session(session);
      if (customer) {
        customerId = customer._id;
      } else {
        // Create a new customer record from billing info
        const newCustomer = new Customer({
          name: billData.customerName,
          phone: billData.mobNo,
          customerType: billData.billType === 'RETAIL' ? 'RETAIL' : 'WHOLESALE',
          deliveryAddress: { fullAddress: billData.address },
          gstNo: billData.gstNo,
          aadharNo: billData.aadharNo,
          reference1: billData.reference1,
          referenceName: billData.referenceName
        });
        const savedCustomer = await newCustomer.save({ session });
        customerId = savedCustomer._id;
      }
    }

    // Pre-check stock for all items
    if (billData.items && billData.items.length > 0) {
      for (const item of billData.items) {
        if (item.product || item.productId) {
          const prodId = item.product || item.productId;
          const product = await Product.findById(prodId).session(session);
          if (!product) throw new AppError(`Product not found`, 404);
          
          if (product.storeStockPieces < item.qty) {
             throw new AppError(`Insufficient stock for ${product.name}. Available: ${product.storeStockPieces}`, 400);
          }
          // ensure product is mapped correctly for the bill
          item.product = prodId; 
        }
      }
    }

    const newBill = new Bill({
      ...billData,
      customer: customerId,
      createdBy: req.userId
    });

    const savedBill = await newBill.save({ session });

    // Deduct stock for all items
    if (savedBill.items && savedBill.items.length > 0) {
      for (const item of savedBill.items) {
        if (item.product) {
          let source = INVENTORY_SOURCES.RETAIL_BILL;
          if (savedBill.billType === 'WHOLESALE') source = INVENTORY_SOURCES.WHOLESALE_BILL;
          if (savedBill.billType === 'NETRATE') source = INVENTORY_SOURCES.NETRATE_BILL;
          if (savedBill.billType === 'TRANSPORT') source = INVENTORY_SOURCES.TRANSPORT_BILL;

          await inventoryService.reduceStock(
            item.product,
            item.qty,
            source,
            savedBill._id,
            req.userId,
            `Bill created: ${savedBill.billNo}`,
            session,
            savedBill.billNo
          );
        }
      }
    }

    await session.commitTransaction();

    res.status(201).json({
      message: 'Bill created successfully',
      bill: savedBill
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const getAllBills = async (req, res, next) => {
  try {
    const { billType, startDate, endDate, status } = req.query;
    
    let query = {};
    if (billType) query.billType = billType;
    if (status) query.status = status;
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bills = await Bill.find(query).sort({ date: -1, createdAt: -1 });
    res.json(bills);
  } catch (error) {
    next(error);
  }
};

export const getBillById = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return next(new AppError('Bill not found', 404));
    }
    res.json(bill);
  } catch (error) {
    next(error);
  }
};

export const cancelBill = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bill = await Bill.findById(req.params.id).session(session);
    if (!bill) {
      throw new AppError('Bill not found', 404);
    }

    if (bill.status === 'cancelled') {
      throw new AppError('Bill is already cancelled', 400);
    }

    bill.status = 'cancelled';
    await bill.save({ session });

    // Restore stock
    if (bill.items && bill.items.length > 0) {
      for (const item of bill.items) {
        if (item.product) {
          await inventoryService.increaseStock(
            item.product,
            item.qty,
            INVENTORY_SOURCES.CANCELLED_BILL, 
            bill._id,
            req.userId,
            `Bill cancelled: ${bill.billNo}`,
            session,
            bill.billNo
          );
        }
      }
    }

    await session.commitTransaction();

    res.json({
      message: 'Bill cancelled successfully',
      bill
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const updateBill = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const billData = req.body;
    const billId = req.params.id;

    // We search by billNo since the frontend passes the billNo as ID in PUT /api/bills/:billNo
    const bill = await Bill.findOne({ billNo: billId }).session(session);
    if (!bill) {
      throw new AppError('Bill not found', 404);
    }

    if (bill.status === 'cancelled') {
      throw new AppError('Cannot update a cancelled bill', 400);
    }

    // 1. Restore old stock
    if (bill.items && bill.items.length > 0) {
      for (const item of bill.items) {
        if (item.product) {
          await inventoryService.increaseStock(
            item.product,
            item.qty,
            INVENTORY_SOURCES.BILL_UPDATE_RESTORE, 
            bill._id,
            req.userId,
            `Restoring stock before update for bill: ${bill.billNo}`,
            session,
            bill.billNo
          );
        }
      }
    }

    // 2. Pre-check new stock for all items
    if (billData.items && billData.items.length > 0) {
      for (const item of billData.items) {
        if (item.product || item.productId) {
          const prodId = item.product || item.productId;
          const product = await Product.findById(prodId).session(session);
          if (!product) throw new AppError(`Product not found`, 404);
          
          if (product.storeStockPieces < item.qty) {
             throw new AppError(`Insufficient stock for ${product.name}. Available: ${product.storeStockPieces}`, 400);
          }
          item.product = prodId; 
        }
      }
    }

    // 3. Update bill
    Object.assign(bill, billData);
    const updatedBill = await bill.save({ session });

    // 4. Deduct new stock
    if (updatedBill.items && updatedBill.items.length > 0) {
      for (const item of updatedBill.items) {
        if (item.product) {
          let source = INVENTORY_SOURCES.RETAIL_BILL;
          if (updatedBill.billType === 'WHOLESALE') source = INVENTORY_SOURCES.WHOLESALE_BILL;
          if (updatedBill.billType === 'NETRATE') source = INVENTORY_SOURCES.NETRATE_BILL;
          if (updatedBill.billType === 'TRANSPORT') source = INVENTORY_SOURCES.TRANSPORT_BILL;

          await inventoryService.reduceStock(
            item.product,
            item.qty,
            source,
            updatedBill._id,
            req.userId,
            `Stock deducted after bill update: ${updatedBill.billNo}`,
            session,
            updatedBill.billNo
          );
        }
      }
    }

    // 5. Update Customer record if gstNo or aadharNo was added
    if (updatedBill.customer) {
      const customer = await Customer.findById(updatedBill.customer).session(session);
      if (customer) {
        let customerUpdated = false;
        if (billData.gstNo && !customer.gstNo) {
          customer.gstNo = billData.gstNo;
          customerUpdated = true;
        }
        if (billData.aadharNo && !customer.aadharNo) {
          customer.aadharNo = billData.aadharNo;
          customerUpdated = true;
        }
        if (customerUpdated) {
          await customer.save({ session });
        }
      }
    }

    await session.commitTransaction();
    res.json(updatedBill);
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const deleteBill = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const billId = req.params.id;

    const bill = await Bill.findOne({ billNo: billId }).session(session);
    if (!bill) {
      throw new AppError('Bill not found', 404);
    }

    if (bill.status !== 'cancelled') {
      // Restore stock if it wasn't already cancelled
      if (bill.items && bill.items.length > 0) {
        for (const item of bill.items) {
          if (item.product) {
            await inventoryService.increaseStock(
              item.product,
              item.qty,
              INVENTORY_SOURCES.DELETED_BILL, 
              bill._id,
              req.userId,
              `Bill deleted: ${bill.billNo}`,
              session,
              bill.billNo
            );
          }
        }
      }
    }

    await Bill.deleteOne({ billNo: billId }).session(session);
    
    await session.commitTransaction();
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};
