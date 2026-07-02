import {
  getPaymentSettings,
  publicPaymentSettings,
  updatePaymentSettings
} from '../services/paymentSettings.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getPublicPaymentMethods = asyncHandler(async (_req, res) => {
  res.json({
    status: 'success',
    data: await publicPaymentSettings()
  });
});

export const getAdminPaymentSettings = asyncHandler(async (_req, res) => {
  res.json({
    status: 'success',
    data: await getPaymentSettings({ bypassCache: true })
  });
});

export const updateAdminPaymentSettings = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    message: 'Payment methods updated',
    data: await updatePaymentSettings(req.body)
  });
});
