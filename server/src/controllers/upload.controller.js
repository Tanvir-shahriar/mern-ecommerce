import { asyncHandler } from '../utils/asyncHandler.js';

export const uploadImages = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  const folder = req.uploadFolder || 'products';

  res.status(201).json({
    status: 'success',
    data: {
      images: files.map((file) => ({
        url: `/uploads/${folder}/${file.filename}`,
        alt: file.originalname.replace(/\.[^.]+$/, ''),
        publicId: file.filename
      }))
    }
  });
});
