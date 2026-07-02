import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { mysqlModels } from './mysql/models.js';

const orderAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    line1: {
      type: String,
      required: true
    },
    line2: String,
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    postalCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'Bangladesh'
    }
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
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
    sku: String,
    image: String,
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    variant: {
      type: Map,
      of: String
    }
  },
  { _id: false }
);

const customerSnapshotSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String
  },
  { _id: false }
);

const paymentProofImageSchema = new mongoose.Schema(
  {
    url: String,
    alt: String,
    publicId: String
  },
  { _id: false }
);

const paymentInstructionsSnapshotSchema = new mongoose.Schema(
  {
    label: String,
    accountName: String,
    accountNumber: String,
    bankName: String,
    branchName: String,
    routingNumber: String,
    providerName: String,
    instructions: String
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator(value) {
          return value.length > 0;
        },
        message: 'Order requires at least one item'
      }
    },
    shippingAddress: {
      type: orderAddressSchema,
      required: true
    },
    billingAddress: orderAddressSchema,
    customerSnapshot: customerSnapshotSchema,
    payment: {
      method: {
        type: String,
        enum: ['cash_on_delivery', 'bank_transfer', 'mobile_banking', 'card', 'paypal', 'stripe'],
        default: 'cash_on_delivery'
      },
      status: {
        type: String,
        enum: ['pending', 'submitted', 'authorized', 'paid', 'failed', 'refunded'],
        default: 'pending'
      },
      transactionId: String,
      accountNumber: String,
      proofImages: [paymentProofImageSchema],
      instructionsSnapshot: paymentInstructionsSnapshotSchema,
      submittedAt: Date,
      updatedAt: Date,
      amount: Number
    },
    pricing: {
      subtotal: {
        type: Number,
        required: true
      },
      discount: {
        type: Number,
        default: 0
      },
      tax: {
        type: Number,
        default: 0
      },
      shipping: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        required: true
      }
    },
    coupon: {
      code: String,
      discountAmount: Number
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
      index: true
    },
    timeline: [
      {
        status: String,
        note: String,
        at: {
          type: Date,
          default: Date.now
        }
      }
    ],
    customerNote: String,
    adminNote: String,
    deliveredAt: Date,
    expectedDeliveryDate: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  },
  {
    timestamps: true
  }
);

orderSchema.pre('validate', function assignOrderNumber() {
  if (!this.orderNumber) {
    const date = new Date();
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    this.orderNumber = `ORD-${datePart}-${randomPart}`;
  }

  if (!this.expectedDeliveryDate) {
    this.expectedDeliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  if (!this.timeline?.length) {
    this.timeline = [{ status: this.status, note: 'Order created' }];
  }
});

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1, createdAt: -1 });
orderSchema.index({ 'items.sku': 1 });
orderSchema.index({ 'customerSnapshot.email': 1 });
orderSchema.index({ 'customerSnapshot.phone': 1 });
orderSchema.index({ 'shippingAddress.phone': 1 });

export const Order = env.databaseProvider === 'mysql' ? mysqlModels.Order : mongoose.model('Order', orderSchema);
