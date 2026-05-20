import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    discountType: {
      type: String,
      enum: ['percent', 'fixed'],
      required: true
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    minOrderAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    maxDiscountAmount: {
      type: Number,
      min: 0
    },
    usageLimit: {
      type: Number,
      min: 0
    },
    usedCount: {
      type: Number,
      default: 0
    },
    expiresAt: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

couponSchema.methods.isUsableFor = function isUsableFor(amount) {
  if (!this.isActive) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  if (this.usageLimit && this.usedCount >= this.usageLimit) return false;
  return amount >= this.minOrderAmount;
};

couponSchema.methods.calculateDiscount = function calculateDiscount(amount) {
  if (!this.isUsableFor(amount)) return 0;

  const rawDiscount = this.discountType === 'percent' ? amount * (this.value / 100) : this.value;
  const cappedDiscount = this.maxDiscountAmount
    ? Math.min(rawDiscount, this.maxDiscountAmount)
    : rawDiscount;

  return Math.min(amount, Math.round(cappedDiscount * 100) / 100);
};

export const Coupon = mongoose.model('Coupon', couponSchema);
