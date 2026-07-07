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

const createFileFilter = (isAllowed, message) => (_req, file, cb) => {
  if (!isAllowed(file.mimetype)) {
    cb(new ApiError(400, message));
    return;
  }
  cb(null, true);
};

const imageFileFilter = createFileFilter(
  (mimeType) => mimeType.startsWith('image/'),
  'Only image uploads are allowed'
);

const imageOrVideoFileFilter = createFileFilter(
  (mimeType) => mimeType.startsWith('image/') || mimeType.startsWith('video/'),
  'Only image and video uploads are allowed'
);

export const setUploadFolder = (folder) => (req, _res, next) => {
  req.uploadFolder = folder;
  next();
};

export const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: env.uploadFileSizeMb * 1024 * 1024,
    files: env.uploadMaxFiles
  }
});

export const galleryUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per image (unconstrained high-res support)
    files: 50 // Up to 50 images per upload action
  }
});

export const heroMediaUpload = multer({
  storage,
  fileFilter: imageOrVideoFileFilter,
  limits: {
    fileSize: 150 * 1024 * 1024,
    files: 12
  }
});
