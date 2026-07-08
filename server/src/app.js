import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import { env } from './config/env.js';
import { sanitizeMongo } from './utils/sanitizeMongo.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';
import {
  assignRequestId,
  authRateLimiter,
  enforceTrustedOrigin,
  globalRateLimiter,
  noStorePrivateApi,
  requireExpectedContentType,
  uploadRateLimiter,
  writeRateLimiter
} from './middleware/security.middleware.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import brandRoutes from './routes/brand.routes.js';
import categoryRoutes from './routes/category.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import galleryRoutes from './routes/gallery.routes.js';
import currencyRoutes from './routes/currency.routes.js';
import sitemapRoutes from './routes/sitemap.routes.js';
import searchRoutes from './routes/search.routes.js';
import contactRoutes from './routes/contact.routes.js';
import heroRoutes from './routes/hero.routes.js';
import brandPageRoutes from './routes/brandPage.routes.js';

export const app = express();
// ... [rest unchanged up to line 100] ...

app.set('trust proxy', 1);

app.use(assignRequestId);
app.use(
  helmet({
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    },
    permissionsPolicy: {
      features: {
        camera: [],
        microphone: [],
        geolocation: [],
        payment: ['self']
      }
    },
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    }
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientUrls.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true
  })
);

app.use(globalRateLimiter);
app.use(enforceTrustedOrigin);
app.use(requireExpectedContentType);

app.use(express.json({ limit: env.apiBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: env.apiBodyLimit }));
app.use(cookieParser());
app.use(hpp());
app.use(sanitizeMongo);
app.use(noStorePrivateApi);

if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.use('/uploads', express.static(path.resolve(env.serverRoot, env.uploadDir)));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'mern-ecommerce-api',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
app.use('/api/uploads', uploadRateLimiter);
app.use(['/api/cart', '/api/orders', '/api/users', '/api/admin', '/api/products', '/api/brands', '/api/categories', '/api/gallery', '/api/contact'], writeRateLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/payment-methods', paymentRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/brand-page', brandPageRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/', sitemapRoutes);
app.use('/api', sitemapRoutes);

app.use(notFound);
app.use(errorHandler);
