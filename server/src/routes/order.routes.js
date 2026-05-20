import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder,
  getOrders,
  updateOrderStatus
} from '../controllers/order.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { checkoutSchema, idParamSchema, orderStatusSchema } from '../validators/schemas.js';

const router = express.Router();

router.use(protect);
router.post('/', validate({ body: checkoutSchema }), createOrder);
router.get('/mine', getMyOrders);
router.get('/:id', validate({ params: idParamSchema }), getOrder);

router.use(restrictTo('admin'));
router.get('/', getOrders);
router.patch('/:id/status', validate({ params: idParamSchema, body: orderStatusSchema }), updateOrderStatus);

export default router;
