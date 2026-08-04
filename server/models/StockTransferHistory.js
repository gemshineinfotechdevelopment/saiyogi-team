import mongoose from 'mongoose';

const stockTransferHistorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    transferQty: {
      type: Number,
      required: true,
      min: 1
    },
    fromLocation: {
      type: String,
      required: true,
      default: 'Godown'
    },
    toLocation: {
      type: String,
      required: true,
      default: 'Shop'
    },
    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    remarks: {
      type: String,
      trim: true
    },
    transferDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model('StockTransferHistory', stockTransferHistorySchema);
