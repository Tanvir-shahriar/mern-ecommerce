import express from 'express';
import {
  addToCart,
  applyCoupon,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem
} from '../controllers/cart.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  addCartItemSchema,
  couponApplySchema,
  idParamSchema,
  updateCartItemSchema
} from '../validators/schemas.js';

const router = express.Router();

router.use(protect);
router.get('/', getCart);
router.post('/items', validate({ body: addCartItemSchema }), addToCart);
router.patch('/items/:id', validate({ params: idParamSchema, body: updateCartItemSchema }), updateCartItem);
router.delete('/items/:id', validate({ params: idParamSchema }), removeCartItem);
router.delete('/', clearCart);
router.post('/coupon', validate({ body: couponApplySchema }), applyCoupon);

export default router;
