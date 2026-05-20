import express from 'express';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory
} from '../controllers/category.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { categorySchema, idParamSchema } from '../validators/schemas.js';

const router = express.Router();

router.get('/', getCategories);

router.use(protect, restrictTo('admin'));
router.post('/', validate({ body: categorySchema }), createCategory);
router.patch('/:id', validate({ params: idParamSchema, body: categorySchema.partial() }), updateCategory);
router.delete('/:id', validate({ params: idParamSchema }), deleteCategory);

export default router;
