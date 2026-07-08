const brandAssetModules = import.meta.glob('../assets/brands/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  import: 'default'
});

const normalizeBrandKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const compactBrandKey = (value) => normalizeBrandKey(value).replace(/-/g, '');

const brandAssetByKey = Object.entries(brandAssetModules).reduce((assets, [path, url]) => {
  const fileName = path.split('/').pop() || '';
  const key = fileName.replace(/\.(png|jpe?g|webp|svg)$/i, '');
  assets[normalizeBrandKey(key)] = url;
  assets[compactBrandKey(key)] = url;
  return assets;
}, {});

const brandAssetAliases = {
  'audemars-piguet': 'ap',
  audemarspiguet: 'ap',
  'beijing-watch': 'beijing',
  beijingwatch: 'beijing',
  'ciga-design': 'ciga',
  cigadesign: 'ciga',
  'grand-seiko': 'grandseiko',
  'jaeger-lecoultre': 'jlc',
  jaegerlecoultre: 'jlc',
  'pagani-design': 'pagani',
  paganidesign: 'pagani',
  'patek-philippe': 'patek',
  patekphilippe: 'patek',
  'san-martin': 'sanmartin',
  'sea-gull': 'seagull',
  'shanghai-watch': 'shanghai',
  shanghaiwatch: 'shanghai',
  'tag-heuer': 'tagheuer',
  'tian-wang': 'tianwang',
  'vacheron-constantin': 'vacheron',
  vacheronconstantin: 'vacheron'
};

const darkBrandAssetKeys = new Set(['tianwang']);

const candidateKeys = (brand = {}) => {
  const rawCandidates = [brand.assetKey, brand.slug, brand.name].filter(Boolean);
  return rawCandidates.flatMap((candidate) => {
    const normalized = normalizeBrandKey(candidate);
    const compact = compactBrandKey(candidate);
    return [normalized, compact, brandAssetAliases[normalized], brandAssetAliases[compact]].filter(Boolean);
  });
};

export const localBrandAsset = (brand) => {
  const assetKey = candidateKeys(brand).find((key) => brandAssetByKey[key]);
  if (!assetKey) return null;

  return {
    key: assetKey,
    url: brandAssetByKey[assetKey],
    mode: darkBrandAssetKeys.has(assetKey) ? 'dark' : 'light'
  };
};
