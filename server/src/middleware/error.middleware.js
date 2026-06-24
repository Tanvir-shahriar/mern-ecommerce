import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

const handleCastError = (error) => new ApiError(400, `Invalid ${error.path}: ${error.value}`);

const handleDuplicateFields = (error) => {
  const fields = Object.keys(error.keyValue || {}).join(', ');
  return new ApiError(409, `${fields || 'Resource'} already exists`);
};

const handleValidationError = (error) => {
  const details = Object.values(error.errors || {}).map((item) => item.message);
  return new ApiError(400, 'Validation failed', details);
};

const handleJwtError = () => new ApiError(401, 'Invalid token. Please sign in again.');

const handleJwtExpiredError = () => new ApiError(401, 'Your session expired. Please sign in again.');

const handlePayloadTooLarge = () =>
  new ApiError(413, `Request payload is too large. Keep product requests under ${env.apiBodyLimit}.`);

const handleUploadLimit = (error) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new ApiError(413, `Image is too large. Upload images up to ${env.uploadFileSizeMb}MB each.`);
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return new ApiError(413, `Too many images. Upload up to ${env.uploadMaxFiles} images at a time.`);
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ApiError(400, 'Unexpected upload field.');
  }

  return new ApiError(400, error.message || 'Upload failed');
};

export const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

export const errorHandler = (error, _req, res, _next) => {
  let handledError = error;

  if (error.name === 'CastError') handledError = handleCastError(error);
  if (error.code === 11000) handledError = handleDuplicateFields(error);
  if (error.name === 'ValidationError') handledError = handleValidationError(error);
  if (error.name === 'JsonWebTokenError') handledError = handleJwtError();
  if (error.name === 'TokenExpiredError') handledError = handleJwtExpiredError();
  if (error.type === 'entity.too.large' || error.status === 413) handledError = handlePayloadTooLarge();
  if (error.name === 'MulterError') handledError = handleUploadLimit(error);

  const statusCode = handledError.statusCode || 500;

  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message: handledError.message || 'Something went wrong',
    details: handledError.details,
    stack: env.isProduction ? undefined : handledError.stack
  });
};
