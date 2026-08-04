import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true
    },
    godownStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    shopStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    minimumStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model('Inventory', inventorySchema);
