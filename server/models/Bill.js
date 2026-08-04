import mongoose from 'mongoose';

const billSchema = new mongoose.Schema(
  {
    billNo: { type: String, required: true, unique: true },
    date: { type: Date, required: true, default: Date.now },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true },
    address: { type: String },
    mobNo: { type: String },
    gstNo: { type: String },
    aadharNo: { type: String },
    reference1: { type: String },
    referenceName: { type: String },
    billType: { 
      type: String, 
      enum: ['RETAIL', 'WHOLESALE', 'NETRATE', 'TRANSPORT'],
      required: true
    },
    cashStatus: { type: String, enum: ['paid', 'unpaid', 'partial'], default: 'unpaid' },
    status: { type: String, enum: ['active', 'cancelled', 'completed', 'held'], default: 'active' },
    
    // Transport specific
    transport: { type: String },
    lrNo: { type: String },
    lrDate: { type: String },
    totalParcel: { type: String },
    toAddress: { type: String },
    companyName: { type: String },
    ownerName: { type: String },
    companyGstNo: { type: String },
    companyAddress: { type: String },
    companyPhone: { type: String },
    
    // Pricing details
    miscCharges: { type: Number, default: 0 },
    miscChargePct: { type: Number, default: 0 },
    miscChargeName: { type: String },
    discountPct: { type: Number, default: 0 },
    packingPct: { type: Number, default: 0 },
    cgstPct: { type: Number, default: 0 },
    sgstPct: { type: Number, default: 0 },
    extraDiscountPct: { type: Number, default: 0 },
    gstPct: { type: Number, default: 0 }, // For transport or consolidated
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    
    // Payment
    rcvdAmount: { type: Number, default: 0 },
    
    // Items
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        uom: { type: String },
        price: { type: Number, required: true },
        hasDiscount: { type: Boolean, default: true },
        amount: { type: Number, required: true },
      }
    ],
    subTotal: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

billSchema.index({ billType: 1 });
billSchema.index({ date: -1 });

export default mongoose.model('Bill', billSchema);
