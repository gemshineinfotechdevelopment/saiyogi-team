import mongoose from 'mongoose';

const chitSubscriptionSchema = new mongoose.Schema(
  {
    schemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChitScheme'
    },
    schemeName: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Paid'],
      default: 'Pending'
    },
    approvalStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    stage: {
      type: String,
      enum: ['Pending Approval', 'Approved', 'Payment Started', 'In Progress', 'Almost Completed', 'Completed', 'Rejected'],
      default: 'Pending Approval'
    },
    monthsPaid: {
      type: Number,
      default: 0
    },
    monthlyPayments: [
      {
        monthNumber: { type: Number, required: true },
        monthName: { type: String, default: '' },
        dueDate: { type: String, default: '' },
        amount: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ['Pending', 'Paid', 'Late Pay'],
          default: 'Pending'
        },
        paidAt: { type: Date },
        paymentMethod: {
          type: String,
          enum: ['Cash', 'UPI', 'Bank Transfer', 'Other', ''],
          default: ''
        },
        transactionNumber: { type: String, default: '' },
        updatedBy: { type: String, default: 'Admin' },
        markedAsRead: { type: Boolean, default: true },
        notes: { type: String, default: '' }
      }
    ],
    paidAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export default mongoose.model('ChitSubscription', chitSubscriptionSchema);
