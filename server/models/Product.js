import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      trim: true
    },
    sku: {
      type: String,
      unique: true,
      required: true,
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    image: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    wholesalePrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    netRate: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    brand: {
      type: String,
      trim: true
    },
    hasDiscount: {
      type: Boolean,
      default: false
    },
    displayNetRate: {
      type: Boolean,
      default: false
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    storeStockPieces: {
      type: Number,
      default: 0,
      min: 0
    },
    godownStockCases: {
      type: Number,
      default: 0,
      min: 0
    },
    piecesPerCase: {
      type: Number,
      default: 1,
      min: 1
    },
    godownStockPieces: {
      type: Number,
      default: 0,
      min: 0
    },
    minimumStock: {
      type: Number,
      default: 0,
      min: 0
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', code: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });

export default mongoose.model('Product', productSchema);
