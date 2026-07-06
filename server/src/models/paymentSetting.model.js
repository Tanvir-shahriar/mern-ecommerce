import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { mysqlModels } from './mysql/models.js';

const paymentMethodImageSchema = new mongoose.Schema(
  {
    url: String,
    alt: String,
    publicId: String
  },
  { _id: false }
);

const paymentMethodSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true
    },
    label: String,
    accountName: String,
    accountNumber: String,
    bankName: String,
    district: String,
    branchName: String,
    routingNumber: String,
    providerName: String,
    paymentType: String,
    instructions: String,
    image: paymentMethodImageSchema
  },
  { _id: false }
);

const paymentSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global_payment_settings',
      unique: true,
      index: true
    },
    methods: {
      cash_on_delivery: paymentMethodSchema,
      bank_transfer: paymentMethodSchema,
      mobile_banking: paymentMethodSchema
    }
  },
  {
    timestamps: true
  }
);

export const PaymentSetting =
  env.databaseProvider === 'mysql'
    ? mysqlModels.PaymentSetting
    : mongoose.model('PaymentSetting', paymentSettingSchema);
