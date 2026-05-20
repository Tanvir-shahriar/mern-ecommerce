import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '..', '..');
const projectRoot = path.resolve(serverRoot, '..');

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

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number(process.env.PORT || 5001),
  clientUrl,
  clientUrls,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mern_ecommerce',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieExpiresDays: Number(process.env.COOKIE_EXPIRES_DAYS || 7),
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  serverRoot,
  projectRoot,
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin123!'
};

export const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'none' : 'lax',
  expires: new Date(Date.now() + env.cookieExpiresDays * 24 * 60 * 60 * 1000)
});
