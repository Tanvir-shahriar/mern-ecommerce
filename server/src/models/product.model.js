import mongoose from 'mongoose';
import slugify from 'slugify';
import { env } from '../config/env.js';
import { mysqlModels } from './mysql/models.js';

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      trim: true
    },
    publicId: String
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    name: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    title: {
      type: String,
      trim: true
    },
    comment: {
      type: String,
      trim: true,
      required: true
    },
    status: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      default: 'approved'
    }
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [140, 'Product name must be 140 characters or fewer']
    },
    slug: {
      type: String,
      lowercase: true,
      index: true,
      unique: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 220
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true
    },
    brand: {
      type: String,
      trim: true,
      index: true
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      uppercase: true,
      unique: true,
      index: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    compareAtPrice: {
      type: Number,
      min: 0
    },
    cost: {
      type: Number,
      min: 0,
      select: false
    },
    images: {
      type: [imageSchema],
      validate: {
        validator(value) {
          return value.length > 0;
        },
        message: 'At least one product image is required'
      }
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true
      }
    ],
    attributes: [
      {
        name: String,
        value: String
      }
    ],
    variants: [
      {
        name: String,
        options: [String]
      }
    ],
    inventory: {
      stock: {
        type: Number,
        min: 0,
        default: 0
      },
      lowStockThreshold: {
        type: Number,
        min: 0,
        default: 5
      },
      trackQuantity: {
        type: Boolean,
        default: true
      }
    },
    shipping: {
      weight: Number,
      dimensions: {
        length: Number,
        width: Number,
        height: Number
      },
      freeShipping: {
        type: Boolean,
        default: false
      }
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
      index: true
    },
    archivedAt: Date,
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    salesCount: {
      type: Number,
      default: 0
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (value) => Math.round(value * 10) / 10
    },
    ratingsCount: {
      type: Number,
      default: 0
    },
    reviews: [reviewSchema],
    seo: {
      title: String,
      description: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ status: 1, category: 1, createdAt: -1 });
productSchema.index({ status: 1, brand: 1, createdAt: -1 });
productSchema.index({ status: 1, isFeatured: 1, ratingsAverage: -1, salesCount: -1 });
productSchema.index({ status: 1, 'inventory.stock': 1 });

productSchema.virtual('isInStock').get(function inStock() {
  return !this.inventory?.trackQuantity || this.inventory.stock > 0;
});

productSchema.pre('validate', function makeSlug() {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});

productSchema.methods.recalculateRatings = function recalculateRatings() {
  const approvedReviews = this.reviews.filter((review) => !review.status || review.status === 'approved');
  this.ratingsCount = approvedReviews.length;
  this.ratingsAverage = approvedReviews.length
    ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) / approvedReviews.length
    : 0;
};

export const Product = env.databaseProvider === 'mysql' ? mysqlModels.Product : mongoose.model('Product', productSchema);
