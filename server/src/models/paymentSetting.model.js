import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { mysqlModels } from './mysql/models.js';

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
    branchName: String,
    routingNumber: String,
    providerName: String,
    instructions: String
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
