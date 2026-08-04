import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';
import StockTransferHistory from '../models/StockTransferHistory.js';
import inventoryService from '../services/inventoryService.js';
import { AppError } from '../middleware/errorHandler.js';
import { INVENTORY_SOURCES } from '../constants/inventorySources.js';

// Internal helper to sync missing inventory docs
const syncInventoryDocs = async () => {
  const products = await Product.find({ isActive: true });
  for (const product of products) {
    let inv = await Inventory.findOne({ productId: product._id });
    if (!inv) {
      await Inventory.create({
        productId: product._id,
        godownStock: product.stock || 0,
        shopStock: 0,
        minimumStock: product.minimumStock || 0
      });
    }
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true });
    
    let totalProducts = 0;
    let totalGodownStock = 0;
    let totalShopStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(product => {
      totalProducts++;
      totalGodownStock += (product.godownStockCases || 0);
      totalShopStock += (product.storeStockPieces || 0);
      
      const minimumStock = product.minimumStock || 0;
      if ((product.storeStockPieces || 0) === 0) {
        outOfStockCount++;
      } else if ((product.storeStockPieces || 0) < minimumStock) {
        lowStockCount++;
      }
    });

    res.json({
      totalProducts,
      totalGodownStock,
      totalShopStock,
      lowStockCount,
      outOfStockCount
    });
  } catch (error) {
    next(error);
  }
};

export const getInventory = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true }).populate('category', 'name slug');
    
    const result = products.map(product => ({
      _id: product._id,
      name: product.name,
      sku: product.sku || product._id.toString(),
      category: product.category,
      storeStockPieces: product.storeStockPieces || 0,
      godownStockCases: product.godownStockCases || 0,
      piecesPerCase: product.piecesPerCase || 1,
      godownStockPieces: product.godownStockPieces || 0,
      totalStock: (product.storeStockPieces || 0) + (product.godownStockPieces || 0),
      minimumStock: product.minimumStock || 0,
      isLowStock: (product.storeStockPieces || 0) > 0 && (product.storeStockPieces || 0) < (product.minimumStock || 0),
      isOutOfStock: (product.storeStockPieces || 0) === 0
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

import InventoryTransaction from '../models/InventoryTransaction.js';

export const transferStock = async (req, res, next) => {
  try {
    const { productId, quantity, remarks } = req.body;

    if (!productId || !quantity) {
      return next(new AppError('Product ID and Quantity are required', 400));
    }

    const qtyCases = parseInt(quantity);
    if (qtyCases <= 0) return next(new AppError('Quantity must be greater than zero', 400));

    const session = await Product.startSession();
    session.startTransaction();

    try {
      const product = await Product.findById(productId).session(session);
      if (!product) throw new Error('Product not found');

      if ((product.godownStockCases || 0) < qtyCases) {
        throw new Error(`Insufficient Godown Stock. Available cases: ${product.godownStockCases || 0}, Requested: ${qtyCases}`);
      }

      const prevGodownCases = product.godownStockCases || 0;
      const prevShopPieces = product.storeStockPieces || 0;
      const piecesPerCase = product.piecesPerCase || 1;
      
      const piecesToTransfer = qtyCases * piecesPerCase;

      product.godownStockCases = prevGodownCases - qtyCases;
      product.godownStockPieces = product.godownStockCases * piecesPerCase;
      product.storeStockPieces = prevShopPieces + piecesToTransfer;
      
      // Update legacy stock fields for compatibility
      product.stock = product.storeStockPieces;

      await product.save({ session });

      const transaction = new InventoryTransaction({
        product: productId,
        type: 'IN', // Shop Perspective
        source: INVENTORY_SOURCES.TRANSFER_TO_SHOP,
        quantity: piecesToTransfer,
        targetLocation: 'TRANSFER',
        qtyAdjustedStr: `-${qtyCases} Cases / +${piecesToTransfer} Pieces`,
        prevGodownCases,
        updatedGodownCases: product.godownStockCases,
        prevShopPieces,
        updatedShopPieces: product.storeStockPieces,
        createdBy: req.userId,
        notes: remarks || 'Godown to Shop Transfer'
      });

      await transaction.save({ session });
      await session.commitTransaction();

      res.json({ message: 'Stock transferred successfully', transfer: transaction });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (error) {
    next(error);
  }
};

export const getLedger = async (req, res, next) => {
  try {
    const { startDate, endDate, productId, type, source, referenceNumber } = req.query;
    
    let query = {};
    if (productId) query.product = productId;
    if (type) query.type = type;
    if (source) query.source = source;
    if (referenceNumber) query.referenceNumber = { $regex: referenceNumber, $options: 'i' };
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const transactions = await InventoryTransaction.find(query)
      .populate('product', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

export const adjustCustomStock = async (req, res, next) => {
  try {
    const { productId, targetLocation, adjustmentType, quantity, reason } = req.body;

    const qty = parseInt(quantity);
    if (!productId || isNaN(qty) || qty <= 0) {
      return next(new AppError('Invalid input data', 400));
    }

    const session = await Product.startSession();
    session.startTransaction();

    try {
      const product = await Product.findById(productId).session(session);
      if (!product) throw new Error('Product not found');

      const prevGodownCases = product.godownStockCases || 0;
      const prevShopPieces = product.storeStockPieces || 0;
      const piecesPerCase = product.piecesPerCase || 1;

      let qtyAdjustedStr = "";
      if (targetLocation === 'GODOWN') {
        if (adjustmentType === 'DECREASE' && prevGodownCases < qty) {
          throw new Error('Insufficient Godown Cases to decrease');
        }
        product.godownStockCases = adjustmentType === 'INCREASE' ? (prevGodownCases + qty) : (prevGodownCases - qty);
        product.godownStockPieces = product.godownStockCases * piecesPerCase;
        qtyAdjustedStr = `${adjustmentType === 'INCREASE' ? '+' : '-'}${qty} Cases`;
      } else if (targetLocation === 'SHOP') {
        if (adjustmentType === 'DECREASE' && prevShopPieces < qty) {
          throw new Error('Insufficient Shop Pieces to decrease');
        }
        product.storeStockPieces = adjustmentType === 'INCREASE' ? (prevShopPieces + qty) : (prevShopPieces - qty);
        product.stock = product.storeStockPieces;
        qtyAdjustedStr = `${adjustmentType === 'INCREASE' ? '+' : '-'}${qty} Pieces`;
      } else {
        throw new Error('Invalid target location');
      }

      await product.save({ session });

      const transaction = new InventoryTransaction({
        product: productId,
        type: adjustmentType === 'INCREASE' ? 'IN' : 'OUT',
        source: INVENTORY_SOURCES.STOCK_ADJUSTMENT,
        quantity: qty,
        targetLocation,
        qtyAdjustedStr,
        prevGodownCases,
        updatedGodownCases: product.godownStockCases,
        prevShopPieces,
        updatedShopPieces: product.storeStockPieces,
        createdBy: req.userId,
        notes: reason || 'Manual stock adjustment'
      });

      await transaction.save({ session });
      await session.commitTransaction();

      res.json({ message: 'Stock adjusted successfully', transaction });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (error) {
    next(error);
  }
};

export const addGodownStock = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    
    const inventory = await Inventory.findOne({ productId });
    if (!inventory) return next(new AppError('Inventory not found', 404));

    inventory.godownStock += parseInt(quantity);
    await inventory.save();

    res.json({
      message: 'Godown stock added successfully',
      godownStock: inventory.godownStock
    });
  } catch (error) {
    next(error);
  }
};

// Legacy support endpoints
export const getInventoryByProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    const inv = await Inventory.findOne({ productId: req.params.productId });
    
    if (!product || !inv) {
      return next(new AppError('Product/Inventory not found', 404));
    }

    res.json({
      _id: product._id,
      name: product.name,
      godownStock: inv.godownStock,
      shopStock: inv.shopStock,
      totalStock: inv.godownStock + inv.shopStock,
      minimumStock: inv.minimumStock
    });
  } catch (error) {
    next(error);
  }
};

export const addStock = async (req, res, next) => {
  try {
    const { productId, quantity, reason } = req.body;
    const inv = await inventoryService.increaseStock(productId, parseInt(quantity), INVENTORY_SOURCES.ADJUSTMENT, null, req.userId, reason);
    res.json({ message: 'Shop Stock added successfully', inv });
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (req, res, next) => {
  try {
    const { productId, quantity, reason } = req.body;
    const product = await Product.findById(productId);
    if (!product) return next(new AppError('Product not found', 404));
    
    const currentStock = product.stock || 0;
    const newStock = currentStock + parseInt(quantity);
    if (newStock < 0) return next(new AppError('Cannot reduce below 0', 400));
    
    await inventoryService.adjustStock(productId, newStock, req.userId, reason);
    
    res.json({ message: 'Stock adjusted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getLowStockProducts = async (req, res, next) => {
  try {
    const inventories = await Inventory.find({ $expr: { $lt: ["$shopStock", "$minimumStock"] } }).populate('productId');
    
    const lowStock = inventories
      .filter(inv => inv.productId && inv.productId.isActive)
      .map(inv => ({
        _id: inv.productId._id,
        name: inv.productId.name,
        shopStock: inv.shopStock,
        godownStock: inv.godownStock,
        minimumStock: inv.minimumStock
      }));

    res.json(lowStock);
  } catch (error) {
    next(error);
  }
};

export const getInventoryMovements = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const history = await inventoryService.getStockHistory(productId);
    res.json(history.transactions);
  } catch (error) {
    next(error);
  }
};
