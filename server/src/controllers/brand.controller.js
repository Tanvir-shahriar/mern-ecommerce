import mongoose from 'mongoose';
import { Brand } from '../models/brand.model.js';
import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const brandProductFilter = (brand) => ({
  $or: [
    { brandRef: brand._id },
    { brand: new RegExp(`^${escapeRegex(brand.name)}$`, 'i') }
  ]
});

const withProductCounts = async (brands) => Promise.all(
  brands.map(async (brand) => ({
    ...brand,
    productCount: await Product.countDocuments({ status: 'active', ...brandProductFilter(brand) })
  }))
);

export const getBrands = asyncHandler(async (_req, res) => {
  const brands = await Brand.find({ isActive: true })
    .sort({ order: 1, name: 1 })
    .lean();

  const brandsWithCounts = await withProductCounts(brands);

  res.json({
    status: 'success',
    results: brandsWithCounts.length,
    data: { brands: brandsWithCounts }
  });
});

export const getBrand = asyncHandler(async (req, res) => {
  const query = mongoose.isValidObjectId(req.params.slugOrId)
    ? { _id: req.params.slugOrId }
    : { slug: req.params.slugOrId };

  const brand = await Brand.findOne({ ...query, isActive: true }).lean();
  if (!brand) throw new ApiError(404, 'Brand not found');

  const [presentedBrand] = await withProductCounts([brand]);

  res.json({
    status: 'success',
    data: { brand: presentedBrand }
  });
});

export const getAdminBrands = asyncHandler(async (_req, res) => {
  const brands = await Brand.find()
    .sort({ order: 1, name: 1 })
    .lean();

  const brandsWithCounts = await withProductCounts(brands);

  res.json({
    status: 'success',
    results: brandsWithCounts.length,
    data: { brands: brandsWithCounts }
  });
});

export const createBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { brand }
  });
});

export const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw new ApiError(404, 'Brand not found');

  const previousName = brand.name;
  Object.assign(brand, req.body);
  await brand.save();

  if (req.body.name && req.body.name !== previousName) {
    await Product.updateMany(
      {
        $or: [
          { brandRef: brand._id },
          { brand: new RegExp(`^${escapeRegex(previousName)}$`, 'i') }
        ]
      },
      {
        $set: {
          brandRef: brand._id,
          brand: brand.name
        }
      }
    );
  }

  res.json({
    status: 'success',
    data: { brand }
  });
});

export const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id).lean();
  if (!brand) throw new ApiError(404, 'Brand not found');

  const inUse = await Product.exists(brandProductFilter(brand));
  if (inUse) {
    throw new ApiError(409, 'Brand is used by products and cannot be deleted');
  }

  await Brand.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
