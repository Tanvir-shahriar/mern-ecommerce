import express from 'express';
import {
  changePassword,
  getMe,
  login,
  logout,
  register,
  updateProfile
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema
} from '../validators/schemas.js';

const router = express.Router();

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);
router.post('/logout', logout);

router.use(protect);
router.get('/me', getMe);
router.patch('/me', validate({ body: updateProfileSchema }), updateProfile);
router.patch('/password', validate({ body: changePasswordSchema }), changePassword);

export default router;
