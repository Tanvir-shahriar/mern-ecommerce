import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    match: { status: 'active' },
    populate: { path: 'category', select: 'name slug' }
  });

  res.json({
    status: 'success',
    data: {
      wishlist: user.wishlist
    }
  });
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const product = await Product.exists({ _id: req.params.id, status: 'active' });
  if (!product) throw new ApiError(404, 'Product not found');

  const exists = req.user.wishlist.some((item) => item.toString() === req.params.id);
  if (exists) {
    req.user.wishlist.pull(req.params.id);
  } else {
    req.user.wishlist.addToSet(req.params.id);
  }

  await req.user.save({ validateBeforeSave: false });

  res.json({
    status: 'success',
    data: {
      added: !exists,
      wishlist: req.user.wishlist
    }
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

  const [users, total] = await Promise.all([
    User.find()
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments()
  ]);

  res.json({
    status: 'success',
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  user.role = req.body.role;
  if (req.body.status) user.status = req.body.status;
  await user.save({ validateBeforeSave: false });

  res.json({
    status: 'success',
    data: { user }
  });
});
