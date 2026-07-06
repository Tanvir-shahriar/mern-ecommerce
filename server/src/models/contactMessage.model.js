import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { mysqlModels } from './mysql/models.js';

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 190,
      index: true
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
      index: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new',
      index: true
    },
    source: {
      type: String,
      default: 'contact_page'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    readAt: Date,
    repliedAt: Date,
    archivedAt: Date
  },
  {
    timestamps: true
  }
);

contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ name: 'text', email: 'text', phone: 'text', message: 'text' });

export const ContactMessage =
  env.databaseProvider === 'mysql'
    ? mysqlModels.ContactMessage
    : mongoose.model('ContactMessage', contactMessageSchema);
