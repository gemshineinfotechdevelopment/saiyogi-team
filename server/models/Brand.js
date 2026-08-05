import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
  {
    brandId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: 'b0001',
    },
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    logo: {
      type: String,
      trim: true,
      default: '/sky_rocket_box.png',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    itemsCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Brand', brandSchema);
