import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { mysqlModels } from './mysql/models.js';

const currencyRateSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    name: String,
    symbol: String,
    locale: String,
    enabled: {
      type: Boolean,
      default: true
    },
    bdtPerUnit: {
      type: Number,
      required: true,
      min: 0.000001
    },
    manualRate: {
      type: Boolean,
      default: false
    },
    source: {
      type: String,
      enum: ['base', 'api', 'manual', 'fallback'],
      default: 'fallback'
    },
    updatedAt: Date
  },
  { _id: false }
);

const currencySettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global',
      unique: true,
      index: true
    },
    baseCurrency: {
      type: String,
      default: 'BDT',
      uppercase: true
    },
    fallbackCurrency: {
      type: String,
      default: 'BDT',
      uppercase: true
    },
    autoDetect: {
      type: Boolean,
      default: true
    },
    autoUpdateRates: {
      type: Boolean,
      default: true
    },
    currencies: {
      type: [currencyRateSchema],
      default: []
    },
    rateProvider: {
      name: String,
      url: String,
      attribution: String,
      lastFetchedAt: Date,
      nextFetchAt: Date,
      lastError: String
    }
  },
  {
    timestamps: true
  }
);

export const CurrencySetting =
  env.databaseProvider === 'mysql'
    ? mysqlModels.CurrencySetting
    : mongoose.model('CurrencySetting', currencySettingSchema);
