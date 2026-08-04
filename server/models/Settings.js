import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: 'Cracker Hub'
    },
    siteDescription: String,
    logo: String,
    favicon: String,
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    enablePackingCharge: {
      type: Boolean,
      default: true
    },
    minimumPurchaseAmount: {
      type: Number,
      default: 500,
      min: 0
    },
    minPurchaseOutsideTN: {
      type: Number,
      default: 1000,
      min: 0
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 999
    },
    deliveryCharge: {
      type: Number,
      default: 99
    },
    currency: {
      type: String,
      default: 'INR'
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: String,
    contact: {
      email: String,
      phone: String,
      address: String
    },
    socialLinks: {
      facebook: String,
      instagram: String,
      twitter: String,
      youtube: String
    },
    features: {
      enableReviews: {
        type: Boolean,
        default: true
      },
      enableWishlist: {
        type: Boolean,
        default: true
      },
      enableCoupon: {
        type: Boolean,
        default: true
      }
    },
    news: {
      type: String,
      default: ''
    },
    billing: {
      companyName: String,
      phone: String,
      email: String,
      whatsapp: String,
      gstNumber: String,
      applyGst: {
        type: Boolean,
        default: false
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
