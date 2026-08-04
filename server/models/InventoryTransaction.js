import mongoose from 'mongoose';
import { INVENTORY_SOURCES } from '../constants/inventorySources.js';

const inventoryTransactionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    type: {
      type: String,
      enum: ['IN', 'OUT'],
      required: true
    },
    source: {
      type: String,
      enum: Object.values(INVENTORY_SOURCES),
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1 // Quantity of the transaction should always be positive, the type IN/OUT indicates addition/subtraction
    },
    previousStock: {
      type: Number
    },
    currentStock: {
      type: Number
    },
    targetLocation: {
      type: String,
      enum: ['GODOWN', 'SHOP', 'TRANSFER', 'BOTH']
    },
    qtyAdjustedStr: {
      type: String
    },
    prevGodownCases: { type: Number },
    updatedGodownCases: { type: Number },
    prevShopPieces: { type: Number },
    updatedShopPieces: { type: Number },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      // Can reference Order, Bill, Purchase, etc.
    },
    referenceNumber: {
      type: String
    },
    sku: {
      type: String
    },
    notes: {
      type: String,
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

inventoryTransactionSchema.index({ product: 1, createdAt: -1 });
inventoryTransactionSchema.index({ source: 1 });
inventoryTransactionSchema.index({ referenceId: 1 });

export default mongoose.model('InventoryTransaction', inventoryTransactionSchema);
