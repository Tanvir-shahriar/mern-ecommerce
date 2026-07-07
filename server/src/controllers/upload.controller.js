import { asyncHandler } from '../utils/asyncHandler.js';

const serializeUpload = (file, folder) => {
  const alt = file.originalname.replace(/\.[^.]+$/, '');
  const publicId = file.filename || `${alt || 'media'}-${Date.now()}`;
  const type = file.mimetype.startsWith('video/') ? 'video' : 'image';

  if (file.buffer) {
    return {
      url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      alt,
      publicId,
      mimeType: file.mimetype,
      type
    };
  }

  return {
    url: `/uploads/${folder}/${file.filename}`,
    alt,
    publicId,
    mimeType: file.mimetype,
    type
  };
};

export const uploadImages = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  const folder = req.uploadFolder || 'products';

  res.status(201).json({
    status: 'success',
    data: {
      images: files.map((file) => serializeUpload(file, folder))
    }
  });
});

export const uploadMedia = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  const folder = req.uploadFolder || 'media';

  res.status(201).json({
    status: 'success',
    data: {
      media: files.map((file) => serializeUpload(file, folder))
    }
  });
});
