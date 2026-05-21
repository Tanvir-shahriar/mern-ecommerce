const unsafeKey = (key) => key.startsWith('$') || key.includes('.');

const sanitizeValue = (value) => {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sanitizeValue);

  return Object.entries(value).reduce((safe, [key, nestedValue]) => {
    if (!unsafeKey(key)) {
      safe[key] = sanitizeValue(nestedValue);
    }
    return safe;
  }, {});
};

export const sanitizeMongo = (req, _res, next) => {
  req.body = sanitizeValue(req.body);
  req.params = sanitizeValue(req.params);
  const safeQuery = sanitizeValue(req.query);
  Object.keys(req.query).forEach((key) => {
    delete req.query[key];
  });
  Object.assign(req.query, safeQuery);
  next();
};
