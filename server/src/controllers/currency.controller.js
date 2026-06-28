import {
  getCurrencySettings,
  publicCurrencyPayload,
  refreshExchangeRates,
  updateCurrencySettings
} from '../services/currency.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getPublicCurrency = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    data: await publicCurrencyPayload(req)
  });
});

export const getAdminCurrencySettings = asyncHandler(async (_req, res) => {
  res.json({
    status: 'success',
    data: await getCurrencySettings({ refreshRates: true })
  });
});

export const updateAdminCurrencySettings = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    message: 'Currency settings updated',
    data: await updateCurrencySettings(req.body)
  });
});

export const refreshAdminCurrencyRates = asyncHandler(async (_req, res) => {
  res.json({
    status: 'success',
    message: 'Currency rates refreshed',
    data: await refreshExchangeRates({ force: true })
  });
});
