import mongoose from 'mongoose';
import { Category } from '../models/category.model.js';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sortOptions = {
  newest: '-createdAt',
  oldest: 'createdAt',
  'price-asc': 'price',
  'price-desc': '-price',
  rating: '-ratingsAverage',
  popular: '-salesCount'
};

const isPublishedReview = (review) => !review.status || review.status === 'approved';

const approvedReviews = (reviews = []) =>
  reviews
    .filter(isPublishedReview)
    .sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0));

const presentPublicReview = (review) => ({
  _id: review._id?.toString?.() || review.id,
  name: review.name || review.user?.name || 'Verified customer',
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt,
  verifiedPurchase: Boolean(review.order)
});

const presentProductDetail = (product) => {
  if (!product) return product;

  const reviews = approvedReviews(product.reviews).map(presentPublicReview);
  const ratingsAverage = reviews.length
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
    : 0;

  return {
    ...product,
    ratingsAverage,
    ratingsCount: reviews.length,
    reviews
  };
};

const resolveCategory = async (category) => {
  if (!category) return null;
  if (mongoose.isValidObjectId(category)) return category;

  const found = await Category.findOne({ slug: category }).select('_id');
  return found?._id || null;
};

const buildProductFilter = async (query, includeInactive = false) => {
  const filter = {};

  if (!includeInactive) {
    filter.status = 'active';
  } else if (query.status && query.status !== 'all') {
    filter.status = query.status;
  }

  if (query.search) {
    const search = String(query.search).trim();
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { name: regex },
      { sku: regex },
      { description: regex },
      { brand: regex },
      { tags: regex }
    ];
  }

  if (query.category && query.category !== 'all') {
    const categoryId = await resolveCategory(query.category);
    filter.category = categoryId || new mongoose.Types.ObjectId();
  }

  if (query.brand) {
    filter.brand = { $in: String(query.brand).split(',').map((brand) => brand.trim()) };
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  if (query.rating) filter.ratingsAverage = { $gte: Number(query.rating) };
  if (query.inStock === 'true') filter['inventory.stock'] = { $gt: 0 };
  if (query.featured === 'true') filter.isFeatured = true;

  return filter;
};

export const getProducts = asyncHandler(async (req, res) => {
  const includeInactive = ['admin', 'super_admin'].includes(req.user?.role) && req.query.admin === 'true';
  const filter = await buildProductFilter(req.query, includeInactive);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 48);
  const skip = (page - 1) * limit;
  const sort = sortOptions[req.query.sort] || sortOptions.newest;

  const [products, total, brands] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
    Product.distinct('brand', { status: 'active', brand: { $ne: null } })
  ]);

  res.json({
    status: 'success',
    results: products.length,
    data: {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        brands: brands.filter(Boolean).sort()
      }
    }
  });
});

export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 16);
  const products = await Product.find({ status: 'active', isFeatured: true })
    .populate('category', 'name slug')
    .sort('-ratingsAverage -salesCount')
    .limit(limit)
    .lean();

  res.json({
    status: 'success',
    data: { products }
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const query = mongoose.isValidObjectId(req.params.slugOrId)
    ? { _id: req.params.slugOrId }
    : { slug: req.params.slugOrId };
  const includeInactive = ['admin', 'super_admin'].includes(req.user?.role) && req.query.admin === 'true';

  const product = await Product.findOne(includeInactive ? query : { ...query, status: 'active' })
    .populate('category', 'name slug')
    .populate('reviews.user', 'name avatar')
    .lean();

  if (!product) throw new ApiError(404, 'Product not found');

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.json({
    status: 'success',
    data: { product: presentProductDetail(product) }
  });
});

export const getSimilarProducts = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, status: 'active' })
    .select('category tags brand')
    .lean();
  if (!product) throw new ApiError(404, 'Product not found');

  const limit = Math.min(Number(req.query.limit) || 4, 12);
  const products = await Product.find({
    _id: { $ne: product._id },
    status: 'active',
    $or: [
      { category: product.category },
      { brand: product.brand },
      { tags: { $in: product.tags || [] } }
    ]
  })
    .populate('category', 'name slug')
    .sort('-ratingsAverage -salesCount -createdAt')
    .limit(limit)
    .lean();

  res.json({
    status: 'success',
    data: { products }
  });
});

export const createProduct = asyncHandler(async (req, res) => {
  const categoryExists = await Category.exists({ _id: req.body.category });
  if (!categoryExists) throw new ApiError(404, 'Category not found');

  const product = await Product.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { product }
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (req.body.category) {
    const categoryExists = await Category.exists({ _id: req.body.category });
    if (!categoryExists) throw new ApiError(404, 'Category not found');
  }

  Object.assign(product, req.body);
  await product.save();

  res.json({
    status: 'success',
    data: { product }
  });
});

export const updateProductStock = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (req.body.stock !== undefined) {
    product.inventory.stock = req.body.stock;
  }

  if (req.body.delta !== undefined) {
    product.inventory.stock = Math.max(0, product.inventory.stock + req.body.delta);
  }

  if (req.body.lowStockThreshold !== undefined) {
    product.inventory.lowStockThreshold = req.body.lowStockThreshold;
  }

  if (req.body.trackQuantity !== undefined) {
    product.inventory.trackQuantity = req.body.trackQuantity;
  }

  await product.save();

  res.json({
    status: 'success',
    message: 'Inventory updated',
    data: { product }
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      status: 'archived',
      archivedAt: new Date(),
      archivedBy: req.user._id
    },
    { new: true }
  );

  if (!product) throw new ApiError(404, 'Product not found');

  res.json({
    status: 'success',
    message: `${product.name} was archived and removed from the storefront`,
    data: { product }
  });
});

export const addReview = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, status: 'active' });
  if (!product) throw new ApiError(404, 'Product not found');

  const deliveredOrder = await Order.findOne({
    _id: req.body.orderId,
    user: req.user._id,
    status: 'delivered',
    'items.product': product._id
  })
    .select('_id')
    .lean();

  if (!deliveredOrder) {
    throw new ApiError(403, 'You can review this product after it has been delivered to you');
  }

  const existingReview = product.reviews.find(
    (review) => review.user.toString() === req.user._id.toString()
  );

  if (existingReview) {
    throw new ApiError(409, 'You have already reviewed this product');
  }

  product.reviews.push({
    user: req.user._id,
    order: deliveredOrder._id,
    name: req.user.name,
    rating: req.body.rating,
    comment: req.body.comment
  });
  product.recalculateRatings();
  await product.save();

  const reviewedProduct = await Product.findById(product._id)
    .populate('category', 'name slug')
    .populate('reviews.user', 'name avatar')
    .lean();

  res.status(201).json({
    status: 'success',
    data: { product: presentProductDetail(reviewedProduct) }
  });
});
