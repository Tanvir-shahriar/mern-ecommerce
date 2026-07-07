import express from 'express';
import { getDashboard } from '../controllers/admin.controller.js';
import { getContactMessages, updateContactMessageStatus } from '../controllers/contact.controller.js';
import { getAdminHeroSettings, updateAdminHeroSettings } from '../controllers/hero.controller.js';
import {
  getAdminCurrencySettings,
  refreshAdminCurrencyRates,
  updateAdminCurrencySettings
} from '../controllers/currency.controller.js';
import {
  getAdminPaymentSettings,
  updateAdminPaymentSettings
} from '../controllers/payment.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { contactMessageStatusSchema, currencySettingsSchema, heroSettingsSchema, idParamSchema, paymentSettingsSchema } from '../validators/schemas.js';

const router = express.Router();

router.use(protect, restrictTo('admin'));
router.get('/dashboard', getDashboard);
router.get('/contact-messages', getContactMessages);
router.patch('/contact-messages/:id', validate({ params: idParamSchema, body: contactMessageStatusSchema }), updateContactMessageStatus);
router.get('/currency', getAdminCurrencySettings);
router.patch('/currency', validate({ body: currencySettingsSchema }), updateAdminCurrencySettings);
router.post('/currency/refresh', refreshAdminCurrencyRates);
router.get('/payment-methods', getAdminPaymentSettings);
router.patch('/payment-methods', validate({ body: paymentSettingsSchema }), updateAdminPaymentSettings);
router.get('/hero', getAdminHeroSettings);
router.patch('/hero', validate({ body: heroSettingsSchema }), updateAdminHeroSettings);

export default router;
