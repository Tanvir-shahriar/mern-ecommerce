import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { mysqlModels } from './mysql/models.js';

const searchLogSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    user: {
      type: String,
      ref: 'User',
      default: null,
      index: true
    },
    count: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

export const SearchLog = env.databaseProvider === 'mysql' ? mysqlModels.SearchLog : mongoose.model('SearchLog', searchLogSchema);
