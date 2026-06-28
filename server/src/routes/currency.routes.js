import express from 'express';
import { getPublicCurrency } from '../controllers/currency.controller.js';

const router = express.Router();

router.get('/', getPublicCurrency);

export default router;
