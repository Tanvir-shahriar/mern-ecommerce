import express from 'express';
import { uploadImages } from '../controllers/upload.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { setUploadFolder, upload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.use(protect, restrictTo('admin'));
router.post('/products', setUploadFolder('products'), upload.array('images', 8), uploadImages);
router.post('/users', setUploadFolder('users'), upload.single('image'), uploadImages);

export default router;
