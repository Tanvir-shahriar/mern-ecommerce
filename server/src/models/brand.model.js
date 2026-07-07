import mongoose from 'mongoose';
import slugify from 'slugify';
import { env } from '../config/env.js';
import { mysqlModels } from './mysql/models.js';

const brandImageSchema = new mongoose.Schema(
  {
    url: String,
    alt: String,
    publicId: String
  },
  { _id: false }
);

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      unique: true
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true
    },
    tagline: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    filterGroup: {
      type: String,
      trim: true,
      default: 'All Brands'
    },
    origin: {
      type: String,
      trim: true
    },
    founded: {
      type: String,
      trim: true
    },
    image: brandImageSchema,
    spotlightImage: brandImageSchema,
    spotlightTitle: {
      type: String,
      trim: true
    },
    spotlightDescription: {
      type: String,
      trim: true
    },
    ctaText: {
      type: String,
      trim: true,
      default: 'Explore Collection'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isSpotlight: {
      type: Boolean,
      default: false,
      index: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

brandSchema.pre('validate', function makeSlug() {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});

export const Brand = env.databaseProvider === 'mysql' ? mysqlModels.Brand : mongoose.model('Brand', brandSchema);
