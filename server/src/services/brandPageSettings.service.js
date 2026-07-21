import { BrandPageSetting } from '../models/brandPageSetting.model.js';
import { Product } from '../models/product.model.js';

const BRAND_PAGE_SETTINGS_KEY = 'brands_page';
const SETTINGS_CACHE_MS = 60 * 1000;

const defaultFaqs = [
  {
    id: 'genuine-brand-watches',
    question: 'Are all products authentic?',
    answer: 'LahVenture ensures 100% genuine products sourced directly from authorized brand distributors with comprehensive warranties.',
    isActive: true
  },
  {
    id: 'shipping-across-bangladesh',
    question: 'Shipping & Delivery Policy',
    answer: 'Orders are dispatched with express courier shipping across Bangladesh, featuring real-time package tracking.',
    isActive: true
  }
];

const defaultCollections = [
  {
    categoryKey: 'fashion',
    title: 'FASHION COLLECTION',
    kicker: 'SPRING / SUMMER 2026',
    stampText: 'FASHION • EXCLUSIVE COLLECTION • 2026',
    tagline: 'Curated Haute Couture, Modern Apparel & Luxury Styling',
    bannerImage: {
      url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
      alt: 'Fashion Collection Hero Banner'
    },
    productIds: [],
    isActive: true,
    order: 0
  },
  {
    categoryKey: 'electronics',
    title: 'ELECTRONICS COLLECTION',
    kicker: 'NEXT-GEN TECH & WEARABLES',
    stampText: 'ELECTRONICS • INNOVATION & TECH • 2026',
    tagline: 'State-of-the-art Audio, Smartwatches & Cutting Edge Devices',
    bannerImage: {
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
      alt: 'Electronics Collection Hero Banner'
    },
    productIds: [],
    isActive: true,
    order: 1
  },
  {
    categoryKey: 'home-living',
    title: 'HOME & LIVING COLLECTION',
    kicker: 'MODERN INTERIORS & DECOR',
    stampText: 'HOME & LIVING • ELEGANT DESIGN • 2026',
    tagline: 'Refined Home Aesthetics, Minimalist Furniture & Living Gear',
    bannerImage: {
      url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
      alt: 'Home & Living Collection Hero Banner'
    },
    productIds: [],
    isActive: true,
    order: 2
  },
  {
    categoryKey: 'beauty-care',
    title: 'BEAUTY & PERSONAL CARE',
    kicker: 'ESSENTIAL CARE & LUXURY BEAUTY',
    stampText: 'BEAUTY • LUXURY CARE • 2026',
    tagline: 'Botanical Skincare, Fragrance Masterpieces & Organic Self-Care',
    bannerImage: {
      url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
      alt: 'Beauty & Personal Care Collection Hero Banner'
    },
    productIds: [],
    isActive: true,
    order: 3
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

const normalizeCollection = (col = {}, index = 0) => ({
  categoryKey: trim(col.categoryKey) || `collection-${index + 1}`,
  title: trim(col.title) || 'COLLECTION',
  kicker: trim(col.kicker) || 'SEASONAL COLLECTION',
  stampText: trim(col.stampText) || 'EXCLUSIVE COLLECTION • 2026',
  tagline: trim(col.tagline) || '',
  bannerImage: col.bannerImage && col.bannerImage.url ? {
    url: trim(col.bannerImage.url),
    alt: trim(col.bannerImage.alt) || col.title || 'Banner',
    publicId: col.bannerImage.publicId ? trim(col.bannerImage.publicId) : undefined
  } : null,
  productIds: Array.isArray(col.productIds) ? col.productIds.map(trim).filter(Boolean) : [],
  isActive: col.isActive !== false,
  order: Number(col.order ?? index)
});

const normalizeCollections = (cols = []) => {
  if (!cols || !cols.length) return clone(defaultCollections);
  return cols.map(normalizeCollection);
};

const defaultSettings = () => ({
  key: BRAND_PAGE_SETTINGS_KEY,
  faqs: normalizeFaqs(defaultFaqs),
  collections: normalizeCollections(defaultCollections)
});

const normalizeSettings = (settings = {}) => ({
  ...clone(settings),
  key: BRAND_PAGE_SETTINGS_KEY,
  faqs: normalizeFaqs(settings.faqs || []),
  collections: normalizeCollections(settings.collections && settings.collections.length ? settings.collections : defaultCollections)
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
    doc.collections = normalized.collections;
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
    faqs: Array.isArray(payload.faqs) ? payload.faqs : current.faqs,
    collections: Array.isArray(payload.collections) ? payload.collections : current.collections
  });
};

export const publicBrandPageSettings = async () => {
  const settings = await getBrandPageSettings();
  const activeFaqs = settings.faqs.filter((faq) => faq.isActive !== false);
  const activeCollections = settings.collections.filter((col) => col.isActive !== false);

  // Fetch all products to match products to collections
  let allProducts = [];
  try {
    allProducts = await Product.find({ status: 'active' }).populate('category').lean();
  } catch (err) {
    allProducts = await Product.find({}).lean();
  }

  const collectionsWithProducts = activeCollections.map((col) => {
    let matchedProducts = [];
    if (col.productIds && col.productIds.length > 0) {
      matchedProducts = allProducts.filter((p) => col.productIds.includes(String(p._id || p.id)));
    }

    // Fallback: If no manually selected products (or fewer than 4), filter products matching key or category
    if (matchedProducts.length < 4) {
      const key = col.categoryKey.toLowerCase();
      const categoryMatches = allProducts.filter((p) => {
        const catName = (p.category?.name || p.categoryName || '').toLowerCase();
        const pTags = (p.tags || []).map((t) => String(t).toLowerCase());
        const pName = (p.name || '').toLowerCase();

        if (key.includes('fashion') || key.includes('cloth')) {
          return catName.includes('cloth') || catName.includes('fashion') || pTags.includes('fashion') || pTags.includes('clothing') || pName.includes('shirt') || pName.includes('jacket');
        }
        if (key.includes('electronics') || key.includes('tech')) {
          return catName.includes('smart') || catName.includes('tech') || catName.includes('electro') || pTags.includes('smartwatch') || pTags.includes('tech') || pTags.includes('electronics');
        }
        if (key.includes('home') || key.includes('living')) {
          return catName.includes('home') || catName.includes('decor') || catName.includes('living') || pTags.includes('home') || pTags.includes('decor') || pName.includes('care') || pName.includes('kit');
        }
        if (key.includes('beauty') || key.includes('care')) {
          return catName.includes('beauty') || catName.includes('skin') || catName.includes('care') || pTags.includes('beauty') || pTags.includes('skincare') || pName.includes('care');
        }
        return true;
      });

      // Merge manually matched + category matches (deduplicated)
      const existingIds = new Set(matchedProducts.map((p) => String(p._id || p.id)));
      for (const prod of categoryMatches) {
        const idStr = String(prod._id || prod.id);
        if (!existingIds.has(idStr)) {
          matchedProducts.push(prod);
          existingIds.add(idStr);
        }
      }
    }

    // If still empty, fall back to all available products
    if (matchedProducts.length === 0) {
      matchedProducts = allProducts.slice(0, 6);
    }

    return {
      ...col,
      products: matchedProducts
    };
  });

  return {
    faqs: activeFaqs,
    collections: collectionsWithProducts
  };
};

export const clearBrandPageSettingsCache = () => {
  settingsCache = {
    value: null,
    cachedAt: 0
  };
};
