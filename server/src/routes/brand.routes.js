import express from 'express';
import {
  createBrand,
  deleteBrand,
  getAdminBrands,
  getBrand,
  getBrands,
  updateBrand
} from '../controllers/brand.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { brandSchema, brandUpdateSchema, idParamSchema, slugOrIdParamSchema } from '../validators/schemas.js';

const router = express.Router();

router.get('/', getBrands);
router.get('/admin', protect, restrictTo('admin'), getAdminBrands);
router.get('/:slugOrId', validate({ params: slugOrIdParamSchema }), getBrand);

router.use(protect, restrictTo('admin'));
router.post('/', validate({ body: brandSchema }), createBrand);
router.patch('/:id', validate({ params: idParamSchema, body: brandUpdateSchema }), updateBrand);
router.delete('/:id', validate({ params: idParamSchema }), deleteBrand);

export default router;
