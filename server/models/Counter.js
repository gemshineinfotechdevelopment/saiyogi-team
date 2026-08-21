import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 8898,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Counter || mongoose.model('Counter', counterSchema);
