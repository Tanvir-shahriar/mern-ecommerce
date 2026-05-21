import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const PUBLIC_CACHE_DIRECTIVE = 'public, max-age=60, s-maxage=180, stale-while-revalidate=300';
const PRIVATE_CACHE_DIRECTIVE = 'no-store, max-age=0';

const originFromReferer = (referer) => {
  if (!referer) return '';

  try {
    const url = new URL(referer);
    return url.origin;
  } catch {
    return '';
  }
};

const isTrustedOrigin = (origin) => env.clientUrls.includes(origin);
const requestOrigin = (req) => `${req.protocol}://${req.get('host')}`;

export const assignRequestId = (req, res, next) => {
  const requestId = req.get('x-request-id') || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

export const enforceTrustedOrigin = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get('origin') || originFromReferer(req.get('referer'));
  if (!origin || isTrustedOrigin(origin) || origin === requestOrigin(req)) return next();

  return next(new ApiError(403, 'Untrusted request origin'));
};

export const requireExpectedContentType = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method) || req.method === 'DELETE') return next();
  if (req.path.startsWith('/api/uploads')) return next();

  const hasBody = req.get('content-length') !== undefined || req.get('transfer-encoding');
  if (!hasBody || req.get('content-length') === '0') return next();
  if (req.is('application/json')) return next();

  return next(new ApiError(415, 'Requests with a body must use application/json'));
};

export const noStorePrivateApi = (req, res, next) => {
  const isPrivatePath = /^\/api\/(auth|cart|orders|users|admin|uploads)(\/|$)/.test(req.path);
  const hasCredentials = Boolean(req.cookies?.token || req.get('authorization'));

  if (!SAFE_METHODS.has(req.method) || isPrivatePath || hasCredentials) {
    res.setHeader('Cache-Control', PRIVATE_CACHE_DIRECTIVE);
  }

  next();
};

export const cachePublic = (seconds = 60) => (_req, res, next) => {
  if (!res.getHeader('Cache-Control')) {
    res.setHeader(
      'Cache-Control',
      seconds === 60
        ? PUBLIC_CACHE_DIRECTIVE
        : `public, max-age=${seconds}, s-maxage=${seconds * 3}, stale-while-revalidate=${seconds * 5}`
    );
  }

  next();
};

const buildLimiter = ({ windowMs, limit, message, skip }) =>
  rateLimit({
    windowMs,
    limit,
    message: {
      status: 'fail',
      message
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip
  });

export const globalRateLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  message: 'Too many requests. Please try again shortly.'
});

export const authRateLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: 'Too many authentication attempts. Please wait and try again.'
});

export const writeRateLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 160,
  message: 'Too many write requests. Please slow down.',
  skip: (req) => SAFE_METHODS.has(req.method)
});

export const uploadRateLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  message: 'Too many upload attempts. Please wait and try again.'
});
