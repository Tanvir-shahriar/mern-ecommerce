import express from 'express';
import { getDashboard } from '../controllers/admin.controller.js';
import { getAdminBrandPageSettings, updateAdminBrandPageSettings } from '../controllers/brandPage.controller.js';
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
import { brandPageSettingsSchema, contactMessageStatusSchema, currencySettingsSchema, heroSettingsSchema, idParamSchema, paymentSettingsSchema } from '../validators/schemas.js';

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
router.get('/brand-page', getAdminBrandPageSettings);
router.patch('/brand-page', validate({ body: brandPageSettingsSchema }), updateAdminBrandPageSettings);

export default router;
