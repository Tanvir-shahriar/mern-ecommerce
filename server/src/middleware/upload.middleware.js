import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const uploadRoot = path.resolve(env.serverRoot, env.uploadDir);

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const diskStorage = multer.diskStorage({
  destination(req, _file, cb) {
    const folder = req.uploadFolder || 'products';
    const destination = path.join(uploadRoot, folder);
    ensureDir(destination);
    cb(null, destination);
  },
  filename(_req, file, cb) {
    const safeName = file.originalname
      .toLowerCase()
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    cb(null, `${safeName || 'image'}-${Date.now()}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const storage = process.env.VERCEL ? multer.memoryStorage() : diskStorage;

const fileFilter = (_req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    cb(new ApiError(400, 'Only image uploads are allowed'));
    return;
  }
  cb(null, true);
};

export const setUploadFolder = (folder) => (req, _res, next) => {
  req.uploadFolder = folder;
  next();
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.uploadFileSizeMb * 1024 * 1024,
    files: env.uploadMaxFiles
  }
});
