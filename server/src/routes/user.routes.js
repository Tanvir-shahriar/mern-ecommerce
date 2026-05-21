import express from 'express';
import {
  getUser,
  getUsers,
  getWishlist,
  toggleWishlist,
  updateUserRole
} from '../controllers/user.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParamSchema, roleUpdateSchema } from '../validators/schemas.js';

const router = express.Router();

router.use(protect);
router.get('/wishlist', getWishlist);
router.post('/wishlist/:id', validate({ params: idParamSchema }), toggleWishlist);

router.use(restrictTo('admin'));
router.get('/', getUsers);
router.get('/:id', validate({ params: idParamSchema }), getUser);
router.patch('/:id/role', validate({ params: idParamSchema, body: roleUpdateSchema }), updateUserRole);

export default router;
