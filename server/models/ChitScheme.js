import mongoose from 'mongoose';

const chitSchemeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    public_id: {
      type: String,
      trim: true,
      default: ''
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    startDate: {
      type: String,
      default: ''
    },
    totalMonths: {
      type: Number,
      default: 11
    },
    dueDateDay: {
      type: Number,
      default: 10
    },
    monthlyAmount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Active', 'Completed', 'Closed'],
      default: 'Active'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('ChitScheme', chitSchemeSchema);
