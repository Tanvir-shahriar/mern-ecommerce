import express from 'express';
import { getRobotsTxt, getSitemapXml } from '../controllers/sitemap.controller.js';
import { cachePublic } from '../middleware/security.middleware.js';

const router = express.Router();

router.get('/robots.txt', cachePublic(3600), getRobotsTxt);
router.get('/sitemap.xml', cachePublic(3600), getSitemapXml);

export default router;
