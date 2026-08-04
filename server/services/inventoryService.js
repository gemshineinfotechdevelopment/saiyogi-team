import Product from '../models/Product.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import Inventory from '../models/Inventory.js';
import StockTransferHistory from '../models/StockTransferHistory.js';
import { INVENTORY_SOURCES } from '../constants/inventorySources.js';

class InventoryService {
  /**
   * Helper to ensure Inventory document exists for a product
   */
  async _ensureInventory(productId, session) {
    let inventory = await Inventory.findOne({ productId }).session(session);
    if (!inventory) {
      const product = await Product.findById(productId).session(session);
      if (!product) throw new Error('Product not found');
      
      // Initialize inventory using existing product stock mapped to shop
      inventory = new Inventory({
        productId,
        godownStock: 0,
        shopStock: product.stock || 0,
        minimumStock: product.minimumStock || 0
      });
      await inventory.save({ session });
    }
    return inventory;
  }

  /**
   * Sync shopStock back to Product.stock for backwards compatibility
   */
  async _syncProductStock(productId, shopStock, session) {
    await Product.findByIdAndUpdate(productId, { stock: shopStock }, { session });
  }

  /**
   * Reduce stock for a given product (Only reduces Shop Stock)
   */
  async reduceStock(productId, quantity, source, referenceId, userId, notes = '', externalSession = null, referenceNumber = '') {
    const session = externalSession || await Product.startSession();
    if (!externalSession) session.startTransaction();
    
    try {
      // Use atomic update to prevent race conditions and ensure stock doesn't go below 0
      const product = await Product.findOneAndUpdate(
        { _id: productId, storeStockPieces: { $gte: quantity } },
        { $inc: { storeStockPieces: -quantity, stock: -quantity } },
        { session, new: false } // Returns the document BEFORE update
      );

      if (!product) {
        // Find product just to give a better error message (or check if it exists at all)
        const checkProduct = await Product.findById(productId).session(session);
        if (!checkProduct) throw new Error('Product not found');
        throw new Error(`Insufficient Shop Stock for product ${checkProduct.name}. Available: ${checkProduct.storeStockPieces}, Requested: ${quantity}`);
      }

      const previousStock = product.storeStockPieces;
      const currentStock = previousStock - quantity;

      // Also update Inventory collection if needed for backward compatibility
      await Inventory.findOneAndUpdate(
        { productId },
        { $set: { shopStock: currentStock } },
        { session, upsert: true }
      );

      // Create transaction record
      const transaction = new InventoryTransaction({
        product: productId,
        type: 'OUT',
        source,
        quantity,
        previousStock,
        currentStock,
        referenceId,
        referenceNumber,
        sku: product.sku,
        createdBy: userId,
        notes
      });

      await transaction.save({ session });

      if (!externalSession) await session.commitTransaction();
      return transaction;
    } catch (error) {
      if (!externalSession) await session.abortTransaction();
      throw error;
    } finally {
      if (!externalSession) session.endSession();
    }
  }

  /**
   * Increase stock for a given product (Increases Shop Stock)
   */
  async increaseStock(productId, quantity, source, referenceId, userId, notes = '', externalSession = null, referenceNumber = '') {
    const session = externalSession || await Product.startSession();
    if (!externalSession) session.startTransaction();
    
    try {
      const product = await Product.findOneAndUpdate(
        { _id: productId },
        { $inc: { storeStockPieces: quantity, stock: quantity } },
        { session, new: false } // returns old doc
      );

      if (!product) throw new Error('Product not found');

      const previousStock = product.storeStockPieces;
      const currentStock = previousStock + quantity;

      // Also update Inventory collection if needed for backward compatibility
      await Inventory.findOneAndUpdate(
        { productId },
        { $set: { shopStock: currentStock } },
        { session, upsert: true }
      );

      // Create transaction record
      const transaction = new InventoryTransaction({
        product: productId,
        type: 'IN',
        source,
        quantity,
        previousStock,
        currentStock,
        referenceId,
        referenceNumber,
        sku: product.sku,
        createdBy: userId,
        notes
      });

      await transaction.save({ session });

      if (!externalSession) await session.commitTransaction();
      return transaction;
    } catch (error) {
      if (!externalSession) await session.abortTransaction();
      throw error;
    } finally {
      if (!externalSession) session.endSession();
    }
  }

  /**
   * Manually adjust stock (Adjusts Shop Stock)
   */
  async adjustStock(productId, newStockQuantity, userId, notes = 'Manual stock adjustment') {
    const session = await Product.startSession();
    session.startTransaction();
    
    try {
      const inventory = await this._ensureInventory(productId, session);

      const previousStock = inventory.shopStock;
      if (previousStock === newStockQuantity) {
        return null; // No change needed
      }

      const type = newStockQuantity > previousStock ? 'IN' : 'OUT';
      const quantity = Math.abs(newStockQuantity - previousStock);

      // Update shop stock
      inventory.shopStock = newStockQuantity;
      await inventory.save({ session });

      // Sync with Product
      await this._syncProductStock(productId, newStockQuantity, session);

      // Create transaction record
      const transaction = new InventoryTransaction({
        product: productId,
        type,
        source: INVENTORY_SOURCES.ADJUSTMENT,
        quantity,
        previousStock,
        currentStock: newStockQuantity,
        createdBy: userId,
        notes
      });

      await transaction.save({ session });

      await session.commitTransaction();
      return transaction;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Transfer Stock from Godown to Shop
   */
  async transferStock(productId, quantity, userId, remarks = '') {
    if (quantity <= 0) throw new Error('Transfer quantity must be greater than zero');
    
    const session = await Product.startSession();
    session.startTransaction();
    
    try {
      const inventory = await this._ensureInventory(productId, session);

      if (inventory.godownStock < quantity) {
        throw new Error(`Insufficient Godown Stock. Available: ${inventory.godownStock}, Requested: ${quantity}`);
      }

      inventory.godownStock -= quantity;
      inventory.shopStock += quantity;
      
      await inventory.save({ session });

      // Sync shopStock to Product for backwards compatibility
      await this._syncProductStock(productId, inventory.shopStock, session);

      const transfer = new StockTransferHistory({
        productId,
        transferQty: quantity,
        fromLocation: 'Godown',
        toLocation: 'Shop',
        transferredBy: userId,
        remarks
      });

      await transfer.save({ session });

      await session.commitTransaction();
      return transfer;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get stock history for a product (InventoryTransactions)
   */
  async getStockHistory(productId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const transactions = await InventoryTransaction.find({ product: productId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email');

    const total = await InventoryTransaction.countDocuments({ product: productId });

    return {
      transactions,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    };
  }
}

export default new InventoryService();
