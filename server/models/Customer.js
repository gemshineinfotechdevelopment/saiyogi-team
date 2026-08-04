import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    alternatePhone: {
      type: String,
      trim: true
    },
    password: {
      type: String
    },
    customerType: {
      type: String,
      enum: ['WEBSITE', 'RETAIL', 'WHOLESALE'],
      default: 'WEBSITE'
    },
    deliveryAddress: {
      fullAddress: String,
      street: String,
      city: String,
      district: String,
      state: String,
      pincode: String,
      country: String
    },
    billingAddress: {
      street: String,
      city: String,
      district: String,
      state: String,
      pincode: String,
      country: String
    },
    gstNo: {
      type: String,
      trim: true
    },
    aadharNo: {
      type: String,
      trim: true
    },
    reference1: {
      type: String,
      trim: true
    },
    referenceName: {
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

customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });

export default mongoose.model('Customer', customerSchema);
