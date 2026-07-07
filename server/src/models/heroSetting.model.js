import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { mysqlModels } from './mysql/models.js';

const heroMediaSchema = new mongoose.Schema(
  {
    url: String,
    alt: String,
    publicId: String,
    mimeType: String
  },
  { _id: false }
);

const heroVideoSchema = new mongoose.Schema(
  {
    url: String,
    thumbnail: String,
    title: String,
    alt: String,
    publicId: String,
    mimeType: String
  },
  { _id: false }
);

const heroSlideSchema = new mongoose.Schema(
  {
    id: String,
    badge: String,
    sku: String,
    title: [String],
    slogan: String,
    subtext: String,
    ctaText: String,
    ctaUrl: String,
    image: heroMediaSchema,
    video: heroVideoSchema,
    gradient: String,
    accentColor: String,
    accentColorRgb: String,
    badgeBg: String,
    badgeColor: String,
    badgeBgTrans: String,
    badgeBorderTrans: String,
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const heroSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'homepage_hero',
      unique: true,
      index: true
    },
    slides: [heroSlideSchema]
  },
  {
    timestamps: true
  }
);

export const HeroSetting =
  env.databaseProvider === 'mysql'
    ? mysqlModels.HeroSetting
    : mongoose.model('HeroSetting', heroSettingSchema);
