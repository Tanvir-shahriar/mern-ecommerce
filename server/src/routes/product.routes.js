import express from 'express';
import {
  addReview,
  createProduct,
  deleteProduct,
  getFeaturedProducts,
  getProduct,
  getProductSections,
  getProducts,
  getSimilarProducts,
  updateProductStock,
  updateProduct
} from '../controllers/product.controller.js';
import { optionalProtect, protect, restrictTo } from '../middleware/auth.middleware.js';
import { cachePublic } from '../middleware/security.middleware.js';
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

router.get('/', optionalProtect, cachePublic(45), getProducts);
router.get('/featured', cachePublic(90), getFeaturedProducts);
router.get('/sections', cachePublic(45), getProductSections);
router.get('/:id/similar', validate({ params: idParamSchema }), cachePublic(60), getSimilarProducts);
router.get('/:slugOrId', optionalProtect, validate({ params: slugOrIdParamSchema }), getProduct);
router.post('/:id/reviews', protect, validate({ params: idParamSchema, body: reviewSchema }), addReview);

router.use(protect, restrictTo('admin'));
router.post('/', validate({ body: productSchema }), createProduct);
router.patch('/:id', validate({ params: idParamSchema, body: productUpdateSchema }), updateProduct);
router.patch('/:id/stock', validate({ params: idParamSchema, body: stockUpdateSchema }), updateProductStock);
router.delete('/:id', validate({ params: idParamSchema }), deleteProduct);

export default router;
