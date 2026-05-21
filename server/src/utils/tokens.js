import jwt from 'jsonwebtoken';
import { cookieOptions, env } from '../config/env.js';

export const signToken = (userId) =>
  jwt.sign({ id: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });

export const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = signToken(user._id);

  res.cookie('token', token, cookieOptions());
  res.status(statusCode).json({
    status: 'success',
    data: {
      user
    }
  });
};

export const clearAuthCookie = (res) => {
  res.cookie('token', '', {
    ...cookieOptions(),
    expires: new Date(0)
  });
};
