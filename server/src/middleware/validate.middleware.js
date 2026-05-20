import { ApiError } from '../utils/ApiError.js';

export const validate = (schemas) => (req, _res, next) => {
  const parsed = {};

  for (const [target, schema] of Object.entries(schemas)) {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }));
      return next(new ApiError(400, 'Invalid request data', details));
    }
    parsed[target] = result.data;
  }

  Object.assign(req, parsed);
  return next();
};
