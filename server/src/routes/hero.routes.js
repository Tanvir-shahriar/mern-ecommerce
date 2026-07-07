import express from 'express';
import { getPublicHeroSettings } from '../controllers/hero.controller.js';

const router = express.Router();

router.get('/', getPublicHeroSettings);

export default router;
