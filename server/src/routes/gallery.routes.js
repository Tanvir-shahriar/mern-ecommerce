import express from 'express';
import { getGallery, updateGallery } from '../controllers/gallery.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { cachePublic } from '../middleware/security.middleware.js';

const router = express.Router();

router.get('/', cachePublic(120), getGallery);

router.use(protect, restrictTo('admin'));
router.put('/', updateGallery);

export default router;
