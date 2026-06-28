import express from 'express';
import { getDashboard } from '../controllers/admin.controller.js';
import {
  getAdminCurrencySettings,
  refreshAdminCurrencyRates,
  updateAdminCurrencySettings
} from '../controllers/currency.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { currencySettingsSchema } from '../validators/schemas.js';

const router = express.Router();

router.use(protect, restrictTo('admin'));
router.get('/dashboard', getDashboard);
router.get('/currency', getAdminCurrencySettings);
router.patch('/currency', validate({ body: currencySettingsSchema }), updateAdminCurrencySettings);
router.post('/currency/refresh', refreshAdminCurrencyRates);

export default router;
