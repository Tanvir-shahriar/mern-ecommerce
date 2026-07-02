import express from 'express';
import { uploadImages } from '../controllers/upload.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { setUploadFolder, upload, galleryUpload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.use(protect);
router.post('/payments', setUploadFolder('payments'), upload.array('images', 5), uploadImages);

router.use(restrictTo('admin'));
router.post('/products', setUploadFolder('products'), upload.array('images', 8), uploadImages);
router.post('/users', setUploadFolder('users'), upload.single('image'), uploadImages);
router.post('/gallery', setUploadFolder('gallery'), galleryUpload.array('images', 50), uploadImages);

export default router;
