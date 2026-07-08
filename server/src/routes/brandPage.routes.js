import express from 'express';
import { getPublicBrandPageSettings } from '../controllers/brandPage.controller.js';

const router = express.Router();

router.get('/', getPublicBrandPageSettings);

export default router;
