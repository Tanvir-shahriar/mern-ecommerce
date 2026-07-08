import {
  getBrandPageSettings,
  publicBrandPageSettings,
  updateBrandPageSettings
} from '../services/brandPageSettings.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getPublicBrandPageSettings = asyncHandler(async (_req, res) => {
  res.json({
    status: 'success',
    data: await publicBrandPageSettings()
  });
});

export const getAdminBrandPageSettings = asyncHandler(async (_req, res) => {
  res.json({
    status: 'success',
    data: await getBrandPageSettings({ bypassCache: true })
  });
});

export const updateAdminBrandPageSettings = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    message: 'Brand FAQ section saved',
    data: await updateBrandPageSettings(req.body)
  });
});
