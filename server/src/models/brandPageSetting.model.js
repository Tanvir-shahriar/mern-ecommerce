import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { mysqlModels } from './mysql/models.js';

const brandFaqSchema = new mongoose.Schema(
  {
    id: String,
    question: String,
    answer: String,
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

const brandPageSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'brands_page',
      unique: true,
      index: true
    },
    faqs: [brandFaqSchema]
  },
  {
    timestamps: true
  }
);

export const BrandPageSetting =
  env.databaseProvider === 'mysql'
    ? mysqlModels.BrandPageSetting
    : mongoose.model('BrandPageSetting', brandPageSettingSchema);
