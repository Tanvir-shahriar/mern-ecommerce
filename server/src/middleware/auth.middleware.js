import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getToken = (req) => {
  if (req.cookies?.token) return req.cookies.token;

  const header = req.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);

  return null;
};

export const protect = asyncHandler(async (req, _res, next) => {
  const token = getToken(req);
  if (!token) throw new ApiError(401, 'Please sign in to continue');

  const decoded = jwt.verify(token, env.jwtSecret);
  const user = await User.findById(decoded.id);

  if (!user || user.status !== 'active') {
    throw new ApiError(401, 'The user for this token no longer exists');
  }

  req.user = user;
  next();
});

export const optionalProtect = asyncHandler(async (req, _res, next) => {
  const token = getToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id);
    if (user?.status === 'active') req.user = user;
  } catch {
    req.user = undefined;
  }

  return next();
});

export const restrictTo = (...roles) => (req, _res, next) => {
  const isAllowed = roles.includes(req.user?.role) || (req.user?.role === 'super_admin' && roles.includes('admin'));

  if (!req.user || req.user.status !== 'active' || !isAllowed) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }

  return next();
};
