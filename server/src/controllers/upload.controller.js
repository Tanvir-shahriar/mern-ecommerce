import { asyncHandler } from '../utils/asyncHandler.js';

export const uploadImages = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  const folder = req.uploadFolder || 'products';

  res.status(201).json({
    status: 'success',
    data: {
      images: files.map((file) => {
        const alt = file.originalname.replace(/\.[^.]+$/, '');
        const publicId = file.filename || `${alt || 'image'}-${Date.now()}`;

        if (file.buffer) {
          return {
            url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            alt,
            publicId
          };
        }

        return {
          url: `/uploads/${folder}/${file.filename}`,
          alt,
          publicId
        };
      })
    }
  });
});
