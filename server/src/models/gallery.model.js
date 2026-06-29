import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { mysqlModels } from './mysql/models.js';

const galleryImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'Image URL is required']
    },
    alt: {
      type: String,
      default: ''
    },
    publicId: {
      type: String,
      default: ''
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { _id: true }
);

const gallerySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'panoramic-library',
      unique: true
    },
    images: [galleryImageSchema]
  },
  {
    timestamps: true
  }
);

export const Gallery =
  env.databaseProvider === 'mysql'
    ? mysqlModels.Gallery
    : mongoose.model('Gallery', gallerySchema);
