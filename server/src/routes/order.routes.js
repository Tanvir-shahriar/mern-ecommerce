import express from 'express';
import {
  createOrder,
  exportOrdersCsv,
  getMyOrders,
  getOrder,
  getOrders,
  updateOrderStatus
} from '../controllers/order.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { checkoutSchema, idParamSchema, orderLookupParamSchema, orderStatusSchema } from '../validators/schemas.js';

const router = express.Router();

router.use(protect);
router.post('/', validate({ body: checkoutSchema }), createOrder);
router.get('/mine', getMyOrders);

router.get('/', restrictTo('admin'), getOrders);
router.get('/export.csv', restrictTo('admin'), exportOrdersCsv);
router.patch('/:id/status', restrictTo('admin'), validate({ params: idParamSchema, body: orderStatusSchema }), updateOrderStatus);
router.get('/:id', validate({ params: orderLookupParamSchema }), getOrder);

export default router;
