import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '..', '..');
const projectRoot = path.resolve(serverRoot, '..');
const runtimeNodeEnv = process.env.NODE_ENV;

dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config({ path: path.join(serverRoot, '.env'), override: true });

const vercelClientUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
const clientUrl = process.env.CLIENT_URL || vercelClientUrl || 'http://localhost:5173';
const clientUrls = clientUrl
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);
if (vercelClientUrl && !clientUrls.includes(vercelClientUrl)) {
  clientUrls.push(vercelClientUrl);
}

const nodeEnv = runtimeNodeEnv || process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const positiveNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
};

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production');
}

export const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 5001),
  databaseProvider: nodeEnv === 'test'
    ? 'mongodb'
    : (process.env.DATABASE_PROVIDER || process.env.DB_PROVIDER || 'mongodb').toLowerCase(),
  clientUrl,
  clientUrls,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mern_ecommerce',
  mysql: {
    host: process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQL_USER || process.env.DB_USER || '',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || ''
  },
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieExpiresDays: Number(process.env.COOKIE_EXPIRES_DAYS || 7),
  apiBodyLimit: process.env.API_BODY_LIMIT || '64mb',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  uploadFileSizeMb: positiveNumber(process.env.UPLOAD_FILE_SIZE_MB, 4),
  uploadMaxFiles: Math.max(1, Math.floor(positiveNumber(process.env.UPLOAD_MAX_FILES, 8))),
  cookieSameSite: process.env.COOKIE_SAME_SITE || 'lax',
  serverRoot,
  projectRoot,
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin123!'
};

export const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.cookieSameSite,
  expires: new Date(Date.now() + env.cookieExpiresDays * 24 * 60 * 60 * 1000)
});
