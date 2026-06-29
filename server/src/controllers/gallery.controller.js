import { Gallery } from '../models/gallery.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getGallery = asyncHandler(async (_req, res) => {
  const gallery = await Gallery.findOne({ key: 'panoramic-library' }).lean();

  res.json({
    status: 'success',
    data: {
      images: gallery?.images?.sort((a, b) => a.order - b.order) || []
    }
  });
});

export const updateGallery = asyncHandler(async (req, res) => {
  const { images } = req.body;

  const ordered = (images || []).map((img, index) => ({
    url: img.url,
    alt: img.alt || '',
    publicId: img.publicId || '',
    order: index
  }));

  const gallery = await Gallery.findOneAndUpdate(
    { key: 'panoramic-library' },
    { images: ordered },
    { upsert: true, new: true, runValidators: true }
  ).lean();

  res.json({
    status: 'success',
    data: {
      images: gallery.images.sort((a, b) => a.order - b.order)
    }
  });
});
