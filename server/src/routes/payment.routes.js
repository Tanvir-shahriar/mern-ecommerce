import express from 'express';
import { getPublicPaymentMethods } from '../controllers/payment.controller.js';

const router = express.Router();

router.get('/', getPublicPaymentMethods);

export default router;
