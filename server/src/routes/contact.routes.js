import express from 'express';
import { createContactMessage } from '../controllers/contact.controller.js';
import { optionalProtect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { contactMessageSchema } from '../validators/schemas.js';

const router = express.Router();

router.post('/', optionalProtect, validate({ body: contactMessageSchema }), createContactMessage);

export default router;
