import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    image: String,
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      min: 1,
      default: 1
    },
    variant: {
      type: Map,
      of: String
    }
  },
  {
    timestamps: true
  }
);

cartItemSchema.virtual('subtotal').get(function subtotal() {
  return Math.round(this.price * this.quantity * 100) / 100;
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    items: [cartItemSchema],
    coupon: {
      code: String,
      discountType: String,
      value: Number,
      discountAmount: {
        type: Number,
        default: 0
      }
    },
    totals: {
      subtotal: {
        type: Number,
        default: 0
      },
      discount: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

cartSchema.methods.recalculateTotals = function recalculateTotals() {
  const subtotal = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = this.coupon?.discountAmount || 0;

  this.totals = {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.max(0, Math.round((subtotal - discount) * 100) / 100)
  };
};

cartSchema.pre('save', function calculateTotals() {
  this.recalculateTotals();
});

export const Cart = mongoose.model('Cart', cartSchema);
