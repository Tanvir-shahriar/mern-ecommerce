import { BrandPageSetting } from '../models/brandPageSetting.model.js';

const BRAND_PAGE_SETTINGS_KEY = 'brands_page';
const SETTINGS_CACHE_MS = 60 * 1000;

const defaultFaqs = [
  {
    id: 'genuine-brand-watches',
    question: 'Are all brand watches genuine?',
    answer: 'LahVenture keeps product and brand details clear so customers can review model, movement, sourcing, and seller information before purchase.',
    isActive: true
  },
  {
    id: 'shipping-across-bangladesh',
    question: 'Shipping terms across Bangladesh',
    answer: 'Orders are dispatched with address-aware checkout details and tracking updates for customers across Bangladesh.',
    isActive: true
  }
];

let settingsCache = {
  value: null,
  cachedAt: 0
};

const clone = (value) => JSON.parse(JSON.stringify(value || {}));
const asPlain = (doc) => (typeof doc?.toObject === 'function' ? doc.toObject() : doc);
const trim = (value) => String(value || '').trim();

const normalizeFaq = (faq = {}, index = 0) => ({
  id: trim(faq.id) || `brand-faq-${index + 1}`,
  question: trim(faq.question),
  answer: trim(faq.answer),
  isActive: faq.isActive !== false,
  order: index
});

const normalizeFaqs = (faqs = []) => faqs
  .map(normalizeFaq)
  .filter((faq) => faq.question && faq.answer);

const defaultSettings = () => ({
  key: BRAND_PAGE_SETTINGS_KEY,
  faqs: normalizeFaqs(defaultFaqs)
});

const normalizeSettings = (settings = {}) => ({
  ...clone(settings),
  key: BRAND_PAGE_SETTINGS_KEY,
  faqs: normalizeFaqs(settings.faqs || [])
});

const setCache = (settings) => {
  settingsCache = {
    value: normalizeSettings(settings),
    cachedAt: Date.now()
  };
  return settingsCache.value;
};

const findRawSettings = async () => BrandPageSetting.findOne({ key: BRAND_PAGE_SETTINGS_KEY });

const saveSettings = async (settings) => {
  const normalized = normalizeSettings(settings);
  let doc = await findRawSettings();

  if (!doc) {
    doc = await BrandPageSetting.create(normalized);
  } else {
    doc.faqs = normalized.faqs;
    if (typeof doc.save === 'function') {
      await doc.save();
    } else {
      await BrandPageSetting.findByIdAndUpdate(doc._id || doc.id, normalized, { new: true });
    }
  }

  return setCache(normalized);
};

export const getBrandPageSettings = async ({ bypassCache = false } = {}) => {
  if (!bypassCache && settingsCache.value && Date.now() - settingsCache.cachedAt < SETTINGS_CACHE_MS) {
    return settingsCache.value;
  }

  const existing = await findRawSettings();
  return existing ? setCache(asPlain(existing)) : defaultSettings();
};

export const updateBrandPageSettings = async (payload = {}) => {
  const current = await getBrandPageSettings({ bypassCache: true });
  return saveSettings({
    ...current,
    faqs: Array.isArray(payload.faqs) ? payload.faqs : current.faqs
  });
};

export const publicBrandPageSettings = async () => {
  const settings = await getBrandPageSettings();
  return {
    faqs: settings.faqs.filter((faq) => faq.isActive !== false)
  };
};

export const clearBrandPageSettingsCache = () => {
  settingsCache = {
    value: null,
    cachedAt: 0
  };
};
