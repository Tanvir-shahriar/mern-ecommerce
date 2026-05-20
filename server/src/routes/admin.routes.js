import express from 'express';
import { getDashboard } from '../controllers/admin.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect, restrictTo('admin'));
router.get('/dashboard', getDashboard);

export default router;
