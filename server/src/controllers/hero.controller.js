import {
  getHeroSettings,
  publicHeroSettings,
  updateHeroSettings
} from '../services/heroSettings.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getPublicHeroSettings = asyncHandler(async (_req, res) => {
  res.json({
    status: 'success',
    data: await publicHeroSettings()
  });
});

export const getAdminHeroSettings = asyncHandler(async (_req, res) => {
  res.json({
    status: 'success',
    data: await getHeroSettings({ bypassCache: true })
  });
});

export const updateAdminHeroSettings = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    message: 'Hero section saved',
    data: await updateHeroSettings(req.body)
  });
});
