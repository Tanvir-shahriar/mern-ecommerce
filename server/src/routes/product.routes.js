import express from 'express';
import {
  addReview,
  createProduct,
  deleteProduct,
  getFeaturedProducts,
  getProduct,
  getProducts,
  getSimilarProducts,
  updateProductStock,
  updateProduct
} from '../controllers/product.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  idParamSchema,
  productSchema,
  productUpdateSchema,
  reviewSchema,
  slugOrIdParamSchema,
  stockUpdateSchema
} from '../validators/schemas.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id/similar', validate({ params: idParamSchema }), getSimilarProducts);
router.get('/:slugOrId', validate({ params: slugOrIdParamSchema }), getProduct);
router.post('/:id/reviews', protect, validate({ params: idParamSchema, body: reviewSchema }), addReview);

router.use(protect, restrictTo('admin'));
router.post('/', validate({ body: productSchema }), createProduct);
router.patch('/:id', validate({ params: idParamSchema, body: productUpdateSchema }), updateProduct);
router.patch('/:id/stock', validate({ params: idParamSchema, body: stockUpdateSchema }), updateProductStock);
router.delete('/:id', validate({ params: idParamSchema }), deleteProduct);

export default router;
