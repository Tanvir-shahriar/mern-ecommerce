import crypto from 'crypto';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { clearAuthCookie, sendAuthResponse } from '../utils/tokens.js';

const normalizeAddresses = (addresses = []) => {
  const defaultIndex = addresses.findIndex((address) => address.isDefault);

  return addresses.map((address, index) => ({
    ...address,
    country: address.country || 'Bangladesh',
    isDefault: defaultIndex === -1 ? index === 0 : index === defaultIndex
  }));
};

export const register = asyncHandler(async (req, res) => {
  const existingUser = await User.exists({ email: req.body.email });
  if (existingUser) throw new ApiError(409, 'Email is already registered');

  const user = await User.create(req.body);
  sendAuthResponse(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.status !== 'active') {
    throw new ApiError(403, 'This account has been blocked');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  sendAuthResponse(res, user);
});

export const socialLogin = asyncHandler(async (req, res) => {
  const { provider, idToken, accessToken } = req.body;
  let email, name;

  if (provider === 'google') {
    // ── Verify Google ID token ──────────────────────────────────
    if (!idToken) throw new ApiError(400, 'Google idToken is required');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'PASTE_YOUR_GOOGLE_CLIENT_ID_HERE') {
      throw new ApiError(503, 'Google sign-in is not configured on this server');
    }

    const { OAuth2Client } = await import('google-auth-library');
    const googleClient = new OAuth2Client(clientId);

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({ idToken, audience: clientId });
    } catch {
      throw new ApiError(401, 'Invalid Google token — please try signing in again');
    }

    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
      throw new ApiError(401, 'Google account email is not verified');
    }

    email = payload.email;
    name  = payload.name || payload.given_name || email.split('@')[0];

  } else if (provider === 'facebook') {
    // ── Verify Facebook access token via Graph API ──────────────
    if (!accessToken) throw new ApiError(400, 'Facebook accessToken is required');

    const appId     = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (
      !appId || appId === 'PASTE_YOUR_FACEBOOK_APP_ID_HERE' ||
      !appSecret || appSecret === 'PASTE_YOUR_FACEBOOK_APP_SECRET_HERE'
    ) {
      throw new ApiError(503, 'Facebook sign-in is not configured on this server');
    }

    // Verify token authenticity with Facebook's debug_token endpoint
    const appToken = `${appId}|${appSecret}`;
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${encodeURIComponent(appToken)}`;
    const debugRes = await fetch(debugUrl);
    const debugJson = await debugRes.json();

    if (!debugJson?.data?.is_valid || debugJson.data.app_id !== appId) {
      throw new ApiError(401, 'Invalid Facebook token — please try signing in again');
    }

    // Fetch user email and name from Graph API
    const meUrl = `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`;
    const meRes = await fetch(meUrl);
    const me = await meRes.json();

    if (!me.email) {
      throw new ApiError(400, 'Facebook account does not share an email address. Please use email/password registration.');
    }

    email = me.email;
    name  = me.name || email.split('@')[0];

  } else {
    throw new ApiError(400, 'Unsupported social provider');
  }

  // ── Find or create user ─────────────────────────────────────
  let user = await User.findOne({ email });

  if (!user) {
    const randomPassword = crypto.randomBytes(16).toString('hex') + 'Aa1!';
    user = await User.create({ name, email, password: randomPassword });
  } else {
    if (user.status !== 'active') {
      throw new ApiError(403, 'This account has been blocked');
    }
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });
  }

  sendAuthResponse(res, user);
});


export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({ status: 'success', message: 'Signed out successfully' });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone', 'addresses'];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.user[field] = field === 'addresses' ? normalizeAddresses(req.body[field]) : req.body[field];
    }
  });

  await req.user.save();

  res.json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(req.body.currentPassword);

  if (!isMatch) throw new ApiError(401, 'Current password is incorrect');

  user.password = req.body.newPassword;
  await user.save();

  sendAuthResponse(res, user);
});
