import { Gallery } from '../models/gallery.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getGallery = asyncHandler(async (_req, res) => {
  const query = Gallery.findOne({ key: 'panoramic-library' });
  const gallery = typeof query.lean === 'function' ? await query.lean() : await query;
  const imageList = gallery?.images || [];

  res.json({
    status: 'success',
    data: {
      images: [...imageList].sort((a, b) => a.order - b.order)
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

  let gallery = await Gallery.findOne({ key: 'panoramic-library' });

  if (!gallery) {
    gallery = await Gallery.create({
      key: 'panoramic-library',
      images: ordered
    });
  } else {
    gallery.images = ordered;
    if (typeof gallery.save === 'function') {
      await gallery.save();
    } else {
      await Gallery.findByIdAndUpdate(gallery._id || gallery.id, { images: ordered }, { new: true });
    }
  }

  const galleryDoc = typeof gallery.toObject === 'function' ? gallery.toObject() : gallery;
  const imageList = galleryDoc.images || [];

  res.json({
    status: 'success',
    data: {
      images: imageList.sort((a, b) => a.order - b.order)
    }
  });
});
