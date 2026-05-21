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
