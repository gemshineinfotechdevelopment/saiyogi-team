import mongoose from 'mongoose';

// Monthly payment sub-schema for individual installment tracking
const monthlyPaymentSchema = new mongoose.Schema(
  {
    monthNumber: { type: Number, required: true },
    monthName: { type: String, default: '' },
    dueDate: { type: String, default: '' },
    expectedAmount: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'],
      default: 'Pending'
    },
    paidAt: { type: Date },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Other', ''],
      default: ''
    },
    transactionNumber: { type: String, default: '' },
    transactionId: { type: String, default: '' },
    receiptNumber: { type: String, default: '' },
    updatedBy: { type: String, default: 'Admin' },
    markedAsRead: { type: Boolean, default: true },
    notes: { type: String, default: '' }
  },
  { _id: true }
);

// Individual scheme subdocument inside an application
const subscribedSchemeSchema = new mongoose.Schema(
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
    monthlyAmountPerPerson: {
      type: Number,
      default: 0
    },
    monthlyAmount: {
      type: Number,
      default: 0
    },
    personCount: {
      type: Number,
      default: 1,
      min: 1
    },
    totalMonthlyAmount: {
      type: Number,
      default: 0
    },
    durationMonths: {
      type: Number,
      default: 10
    },
    totalMonths: {
      type: Number,
      default: 10
    },
    dueDateDay: {
      type: Number,
      default: 10
    },
    totalSchemeAmount: {
      type: Number,
      default: 0
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    remainingAmount: {
      type: Number,
      default: 0
    },
    monthsPaid: {
      type: Number,
      default: 0
    },
    paidInstallments: {
      type: Number,
      default: 0
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
    monthlyPayments: [monthlyPaymentSchema]
  },
  { _id: true, timestamps: true }
);

// Top-level Chit Subscription / Application Schema
const chitSubscriptionSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true
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
    // Multi-scheme array
    schemes: [subscribedSchemeSchema],

    // Aggregated figures for multi-scheme applications
    totalPersons: {
      type: Number,
      default: 1
    },
    combinedMonthlyAmount: {
      type: Number,
      default: 0
    },
    combinedGrandTotal: {
      type: Number,
      default: 0
    },
    totalPaidAmount: {
      type: Number,
      default: 0
    },
    remainingGrandTotal: {
      type: Number,
      default: 0
    },

    // Application-level Status & Lifecycle
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

    // Legacy fields preserved for backward compatibility
    schemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChitScheme'
    },
    schemeName: {
      type: String,
      trim: true,
      default: ''
    },
    personCount: {
      type: Number,
      default: 1
    },
    monthlyAmount: {
      type: Number,
      default: 0
    },
    monthsPaid: {
      type: Number,
      default: 0
    },
    monthlyPayments: [monthlyPaymentSchema],
    paidAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Pre-save hook to ensure synchronization between schemes array and top-level fields
chitSubscriptionSchema.pre('save', function (next) {
  try {
    // If schemes array is populated
    if (Array.isArray(this.schemes) && this.schemes.length > 0) {
      let calcTotalPersons = 0;
      let calcCombinedMonthly = 0;
      let calcCombinedGrand = 0;
      let calcTotalPaid = 0;

      // Check if top-level approval is cascaded
      const topApproved = this.approvalStatus === 'Approved' || this.status === 'Approved';
      const topRejected = this.approvalStatus === 'Rejected' || this.status === 'Rejected';

      this.schemes.forEach((sch) => {
        const persons = Math.max(1, sch.personCount || 1);
        let monthly = sch.monthlyAmountPerPerson || sch.monthlyAmount || 0;
        if (monthly === 0 && sch.schemeName) {
          const match = sch.schemeName.match(/\d+/);
          if (match) monthly = parseInt(match[0], 10);
        }
        const duration = sch.durationMonths || sch.totalMonths || 10;
        const totalMonthly = monthly * persons;
        const totalScheme = totalMonthly * duration;

        sch.personCount = persons;
        sch.monthlyAmountPerPerson = monthly;
        sch.monthlyAmount = monthly;
        sch.totalMonthlyAmount = totalMonthly;
        sch.durationMonths = duration;
        sch.totalMonths = duration;
        sch.totalSchemeAmount = totalScheme;

        if (topApproved && sch.approvalStatus !== 'Rejected') {
          sch.approvalStatus = 'Approved';
          sch.status = 'Approved';
        } else if (topRejected) {
          sch.approvalStatus = 'Rejected';
          sch.status = 'Rejected';
          sch.stage = 'Rejected';
        }

        // Calculate paid amount from payments
        if (Array.isArray(sch.monthlyPayments)) {
          const paidLogs = sch.monthlyPayments.filter(
            p => ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'].includes(p.status)
          );
          sch.monthsPaid = paidLogs.length;
          sch.paidInstallments = paidLogs.length;
          sch.paidAmount = paidLogs.reduce((sum, p) => sum + (p.amount || p.paidAmount || totalMonthly), 0);
          sch.remainingAmount = Math.max(0, totalScheme - sch.paidAmount);

          // Update scheme stage
          if (sch.approvalStatus === 'Approved' || sch.status === 'Approved') {
            if (sch.monthsPaid === 0) sch.stage = 'Payment Started';
            else if (sch.monthsPaid >= duration) sch.stage = 'Completed';
            else if (sch.monthsPaid >= Math.ceil(duration * 0.75)) sch.stage = 'Almost Completed';
            else sch.stage = 'In Progress';
          }
        }

        calcTotalPersons += persons;
        calcCombinedMonthly += totalMonthly;
        calcCombinedGrand += totalScheme;
        calcTotalPaid += (sch.paidAmount || 0);
      });

      this.totalPersons = calcTotalPersons;
      this.combinedMonthlyAmount = calcCombinedMonthly;
      this.combinedGrandTotal = calcCombinedGrand;
      this.totalPaidAmount = calcTotalPaid;
      this.remainingGrandTotal = Math.max(0, calcCombinedGrand - calcTotalPaid);

      // Status synchronization
      if (this.schemes.some(s => s.approvalStatus === 'Approved' || s.status === 'Approved')) {
        this.approvalStatus = 'Approved';
        this.status = 'Approved';
      } else if (this.schemes.length > 0 && this.schemes.every(s => s.approvalStatus === 'Rejected' || s.status === 'Rejected')) {
        this.approvalStatus = 'Rejected';
        this.status = 'Rejected';
        this.stage = 'Rejected';
      }

      // Keep legacy top-level fields populated from first scheme
      const firstSch = this.schemes[0];
      this.schemeId = firstSch.schemeId || this.schemeId;
      this.schemeName = firstSch.schemeName || this.schemeName;
      this.personCount = firstSch.personCount || 1;
      this.monthlyAmount = firstSch.totalMonthlyAmount || firstSch.monthlyAmount;
      this.monthsPaid = firstSch.monthsPaid || 0;
      if (this.schemes.length === 1 && firstSch.monthlyPayments) {
        this.monthlyPayments = firstSch.monthlyPayments;
      }
    } else if (this.schemeName) {
      // Legacy document without schemes array: populate default schemes array
      let monthly = this.monthlyAmount || 0;
      if (monthly === 0 && this.schemeName) {
        const match = this.schemeName.match(/\d+/);
        if (match) monthly = parseInt(match[0], 10);
      }
      const persons = Math.max(1, this.personCount || 1);
      const totalMonthly = monthly * persons;
      const duration = 10;
      const totalScheme = totalMonthly * duration;
      const paid = Array.isArray(this.monthlyPayments)
        ? this.monthlyPayments.filter(p => ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'].includes(p.status)).reduce((s, p) => s + (p.amount || monthly), 0)
        : 0;

      this.schemes = [
        {
          schemeId: this.schemeId,
          schemeName: this.schemeName,
          monthlyAmountPerPerson: monthly,
          monthlyAmount: monthly,
          personCount: persons,
          totalMonthlyAmount: totalMonthly,
          durationMonths: duration,
          totalMonths: duration,
          dueDateDay: 10,
          totalSchemeAmount: totalScheme,
          paidAmount: paid,
          remainingAmount: Math.max(0, totalScheme - paid),
          monthsPaid: this.monthsPaid || 0,
          paidInstallments: this.monthsPaid || 0,
          status: this.status || 'Pending',
          approvalStatus: this.approvalStatus || 'Pending',
          stage: this.stage || 'Pending Approval',
          monthlyPayments: this.monthlyPayments || []
        }
      ];

      this.totalPersons = persons;
      this.combinedMonthlyAmount = totalMonthly;
      this.combinedGrandTotal = totalScheme;
      this.totalPaidAmount = paid;
      this.remainingGrandTotal = Math.max(0, totalScheme - paid);
    }
  } catch (err) {
    console.error('Error in ChitSubscription pre-save hook:', err);
  }
  if (typeof next === 'function') {
    next();
  }
});

export default mongoose.models.ChitSubscription || mongoose.model('ChitSubscription', chitSubscriptionSchema);
