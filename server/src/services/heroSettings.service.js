import { HeroSetting } from '../models/heroSetting.model.js';

const HERO_SETTINGS_KEY = 'homepage_hero';
const SETTINGS_CACHE_MS = 60 * 1000;

let settingsCache = {
  value: null,
  cachedAt: 0
};

const clone = (value) => JSON.parse(JSON.stringify(value || {}));
const asPlain = (doc) => (typeof doc?.toObject === 'function' ? doc.toObject() : doc);
const trim = (value) => String(value || '').trim();

const defaultSettings = () => ({
  key: HERO_SETTINGS_KEY,
  slides: []
});

const normalizeMedia = (media) => {
  if (!media?.url) return null;

  return {
    url: trim(media.url),
    alt: trim(media.alt),
    publicId: trim(media.publicId),
    mimeType: trim(media.mimeType)
  };
};

const normalizeVideo = (video) => {
  if (!video?.url && !video?.thumbnail) return null;

  return {
    url: trim(video.url),
    thumbnail: trim(video.thumbnail),
    title: trim(video.title),
    alt: trim(video.alt),
    publicId: trim(video.publicId),
    mimeType: trim(video.mimeType)
  };
};

const normalizeTitle = (title) => {
  const lines = Array.isArray(title)
    ? title
    : String(title || '').split(/\r?\n/);

  return lines
    .map((line) => trim(line))
    .filter(Boolean)
    .slice(0, 5);
};

const normalizeSlide = (slide = {}, index = 0) => ({
  id: trim(slide.id) || `hero-${index + 1}`,
  badge: trim(slide.badge),
  sku: trim(slide.sku),
  title: normalizeTitle(slide.title),
  slogan: trim(slide.slogan),
  subtext: trim(slide.subtext),
  ctaText: trim(slide.ctaText) || 'Shop',
  ctaUrl: trim(slide.ctaUrl) || '/products',
  image: normalizeMedia(slide.image),
  video: normalizeVideo(slide.video),
  gradient: trim(slide.gradient),
  accentColor: trim(slide.accentColor) || '#7a0b17',
  accentColorRgb: trim(slide.accentColorRgb) || '122, 11, 23',
  badgeBg: trim(slide.badgeBg),
  badgeColor: trim(slide.badgeColor) || '#dfc8ad',
  badgeBgTrans: trim(slide.badgeBgTrans),
  badgeBorderTrans: trim(slide.badgeBorderTrans),
  isActive: slide.isActive !== false,
  order: index
});

const normalizeSettings = (settings = {}) => ({
  ...defaultSettings(),
  ...clone(settings),
  key: HERO_SETTINGS_KEY,
  slides: (settings.slides || []).map(normalizeSlide)
});

const setCache = (settings) => {
  settingsCache = {
    value: normalizeSettings(settings),
    cachedAt: Date.now()
  };
  return settingsCache.value;
};

const findRawSettings = async () => HeroSetting.findOne({ key: HERO_SETTINGS_KEY });

const saveSettings = async (settings) => {
  const normalized = normalizeSettings(settings);
  let doc = await findRawSettings();

  if (!doc) {
    doc = await HeroSetting.create(normalized);
  } else {
    doc.slides = normalized.slides;
    if (typeof doc.save === 'function') {
      await doc.save();
    } else {
      await HeroSetting.findByIdAndUpdate(doc._id || doc.id, normalized, { new: true });
    }
  }

  return setCache(normalized);
};

export const getHeroSettings = async ({ bypassCache = false } = {}) => {
  if (!bypassCache && settingsCache.value && Date.now() - settingsCache.cachedAt < SETTINGS_CACHE_MS) {
    return settingsCache.value;
  }

  const existing = await findRawSettings();
  return existing ? setCache(asPlain(existing)) : defaultSettings();
};

export const updateHeroSettings = async (payload = {}) => {
  const current = await getHeroSettings({ bypassCache: true });
  return saveSettings({
    ...current,
    slides: payload.slides || current.slides
  });
};

export const publicHeroSettings = async () => {
  const settings = await getHeroSettings();
  return {
    slides: settings.slides.filter((slide) => slide.isActive !== false)
  };
};

export const clearHeroSettingsCache = () => {
  settingsCache = {
    value: null,
    cachedAt: 0
  };
};
