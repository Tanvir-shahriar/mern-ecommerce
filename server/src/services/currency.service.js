import { CurrencySetting } from '../models/currencySetting.model.js';

const GLOBAL_CURRENCY_KEY = 'global';
const SETTINGS_CACHE_MS = 60 * 1000;
const RATE_REFRESH_MS = 12 * 60 * 60 * 1000;
const RATE_PROVIDER_URL = 'https://open.er-api.com/v6/latest/BDT';

export const currencyDefinitions = {
  BDT: { name: 'Bangladeshi Taka', symbol: '৳', locale: 'en-BD', bdtPerUnit: 1 },
  USD: { name: 'US Dollar', symbol: '$', locale: 'en-US', bdtPerUnit: 120 },
  EUR: { name: 'Euro', symbol: '€', locale: 'de-DE', bdtPerUnit: 130 },
  GBP: { name: 'British Pound', symbol: '£', locale: 'en-GB', bdtPerUnit: 152 },
  CAD: { name: 'Canadian Dollar', symbol: 'CA$', locale: 'en-CA', bdtPerUnit: 88 },
  AUD: { name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU', bdtPerUnit: 79 },
  AED: { name: 'UAE Dirham', symbol: 'د.إ', locale: 'en-AE', bdtPerUnit: 33 },
  SAR: { name: 'Saudi Riyal', symbol: 'ر.س', locale: 'en-SA', bdtPerUnit: 32 },
  INR: { name: 'Indian Rupee', symbol: '₹', locale: 'en-IN', bdtPerUnit: 1.4 },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG', bdtPerUnit: 90 },
  MYR: { name: 'Malaysian Ringgit', symbol: 'RM', locale: 'ms-MY', bdtPerUnit: 26 }
};

const europeanCountries = new Set([
  'AT',
  'BE',
  'CY',
  'DE',
  'EE',
  'ES',
  'FI',
  'FR',
  'GR',
  'HR',
  'IE',
  'IT',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'PT',
  'SI',
  'SK'
]);

const countryCurrencyMap = {
  BD: 'BDT',
  US: 'USD',
  CA: 'CAD',
  GB: 'GBP',
  UK: 'GBP',
  AU: 'AUD',
  AE: 'AED',
  SA: 'SAR',
  IN: 'INR',
  SG: 'SGD',
  MY: 'MYR'
};

let settingsCache = {
  value: null,
  cachedAt: 0
};

const clone = (value) => JSON.parse(JSON.stringify(value ?? null));
const nowIso = () => new Date().toISOString();
const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const sanitizeCurrencyCode = (value) => {
  const code = String(value || '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : '';
};

const sanitizeCountryCode = (value) => {
  const code = String(value || '').trim().toUpperCase();
  if (code === 'EU') return code;
  return /^[A-Z]{2}$/.test(code) ? code : '';
};

const headerValue = (req, key) => {
  const value = req.get?.(key);
  return Array.isArray(value) ? value[0] : value;
};

const countryFromTimezone = (timezone = '') => {
  const value = String(timezone || '');
  if (value === 'Asia/Dhaka') return 'BD';
  if (value === 'Asia/Kolkata' || value === 'Asia/Calcutta') return 'IN';
  if (value === 'Asia/Dubai') return 'AE';
  if (value === 'Asia/Riyadh') return 'SA';
  if (value === 'Asia/Singapore') return 'SG';
  if (value === 'Asia/Kuala_Lumpur') return 'MY';
  if (value === 'Europe/London') return 'GB';
  if (value.startsWith('Europe/')) return 'EU';
  if (value.startsWith('Australia/')) return 'AU';
  if (value.startsWith('America/Toronto') || value.startsWith('America/Vancouver')) return 'CA';
  if (value.startsWith('America/')) return 'US';
  return '';
};

const countryFromAcceptLanguage = (acceptLanguage = '') => {
  const firstLanguage = String(acceptLanguage || '').split(',')[0] || '';
  const region = firstLanguage.split('-')[1];
  return sanitizeCountryCode(region);
};

const defaultCurrencies = () =>
  Object.entries(currencyDefinitions).map(([code, definition]) => ({
    code,
    ...definition,
    enabled: true,
    manualRate: false,
    source: code === 'BDT' ? 'base' : 'fallback',
    updatedAt: nowIso()
  }));

const defaultSettings = () => ({
  key: GLOBAL_CURRENCY_KEY,
  baseCurrency: 'BDT',
  fallbackCurrency: 'BDT',
  autoDetect: true,
  autoUpdateRates: true,
  currencies: defaultCurrencies(),
  rateProvider: {
    name: 'ExchangeRate-API Open Access',
    url: RATE_PROVIDER_URL,
    attribution: 'Exchange rates by ExchangeRate-API open access endpoint',
    lastFetchedAt: null,
    nextFetchAt: null,
    lastError: ''
  }
});

const normalizeCurrency = (currency) => {
  const code = sanitizeCurrencyCode(currency?.code);
  if (!code || !currencyDefinitions[code]) return null;

  const definition = currencyDefinitions[code];
  const rawRate = Number(currency?.bdtPerUnit);
  return {
    code,
    name: currency.name || definition.name,
    symbol: currency.symbol || definition.symbol,
    locale: currency.locale || definition.locale,
    enabled: code === 'BDT' ? true : currency.enabled !== false,
    bdtPerUnit: code === 'BDT' ? 1 : Number.isFinite(rawRate) && rawRate > 0 ? rawRate : definition.bdtPerUnit,
    manualRate: code === 'BDT' ? false : Boolean(currency.manualRate),
    source: code === 'BDT' ? 'base' : currency.source || 'fallback',
    updatedAt: currency.updatedAt || nowIso()
  };
};

const normalizeSettings = (settings = {}) => {
  const existingByCode = new Map((settings.currencies || []).map((currency) => [sanitizeCurrencyCode(currency.code), currency]));
  const currencies = Object.keys(currencyDefinitions)
    .map((code) => normalizeCurrency({ ...currencyDefinitions[code], ...(existingByCode.get(code) || {}), code }))
    .filter(Boolean);

  const fallbackCurrency = sanitizeCurrencyCode(settings.fallbackCurrency);
  const fallbackIsEnabled = currencies.some((currency) => currency.code === fallbackCurrency && currency.enabled);

  return {
    ...defaultSettings(),
    ...clone(settings),
    key: GLOBAL_CURRENCY_KEY,
    baseCurrency: 'BDT',
    fallbackCurrency: fallbackIsEnabled ? fallbackCurrency : 'BDT',
    autoDetect: settings.autoDetect !== false,
    autoUpdateRates: settings.autoUpdateRates !== false,
    currencies,
    rateProvider: {
      ...defaultSettings().rateProvider,
      ...(settings.rateProvider || {})
    }
  };
};

const asPlain = (doc) => {
  if (!doc) return doc;
  if (typeof doc.toObject === 'function') return doc.toObject();
  return clone(doc);
};

const setCache = (settings) => {
  settingsCache = {
    value: normalizeSettings(settings),
    cachedAt: Date.now()
  };
  return settingsCache.value;
};

const findRawSettings = async () => CurrencySetting.findOne({ key: GLOBAL_CURRENCY_KEY });

const saveSettings = async (settings) => {
  const normalized = normalizeSettings(settings);
  let doc = await findRawSettings();

  if (!doc) {
    doc = await CurrencySetting.create(normalized);
    return setCache(asPlain(doc));
  }

  delete normalized._id;
  delete normalized.id;
  Object.assign(doc, normalized);
  if (typeof doc.save === 'function') {
    await doc.save();
  } else {
    await CurrencySetting.findByIdAndUpdate(doc._id, normalized, { new: true });
  }

  return setCache(asPlain(doc));
};

export const getCurrencySettings = async ({ bypassCache = false, refreshRates = false } = {}) => {
  if (!bypassCache && settingsCache.value && Date.now() - settingsCache.cachedAt < SETTINGS_CACHE_MS) {
    const cached = settingsCache.value;
    if (refreshRates) return maybeRefreshRates(cached);
    return cached;
  }

  const existing = await findRawSettings();
  const settings = existing ? setCache(asPlain(existing)) : await saveSettings(defaultSettings());

  if (refreshRates) return maybeRefreshRates(settings);
  return settings;
};

const rateNeedsRefresh = (settings) => {
  if (!settings.autoUpdateRates) return false;
  const fetchedAt = settings.rateProvider?.lastFetchedAt ? new Date(settings.rateProvider.lastFetchedAt).getTime() : 0;
  return !fetchedAt || Date.now() - fetchedAt >= RATE_REFRESH_MS;
};

export const refreshExchangeRates = async ({ force = false } = {}) => {
  const settings = await getCurrencySettings({ bypassCache: true });
  if (!force && !rateNeedsRefresh(settings)) return settings;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(RATE_PROVIDER_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`Rate provider returned ${response.status}`);
    const payload = await response.json();
    if (payload.result && payload.result !== 'success') {
      throw new Error(payload['error-type'] || 'Rate provider error');
    }

    const nextCurrencies = settings.currencies.map((currency) => {
      if (currency.code === 'BDT') return { ...currency, bdtPerUnit: 1, source: 'base', updatedAt: nowIso() };
      if (currency.manualRate) return currency;

      const providerRate = Number(payload.rates?.[currency.code]);
      if (!Number.isFinite(providerRate) || providerRate <= 0) return currency;

      return {
        ...currency,
        bdtPerUnit: Math.round((1 / providerRate) * 10000) / 10000,
        source: 'api',
        updatedAt: nowIso()
      };
    });

    return saveSettings({
      ...settings,
      currencies: nextCurrencies,
      rateProvider: {
        ...settings.rateProvider,
        lastFetchedAt: nowIso(),
        nextFetchAt: new Date(Date.now() + RATE_REFRESH_MS).toISOString(),
        lastError: ''
      }
    });
  } catch (error) {
    return saveSettings({
      ...settings,
      rateProvider: {
        ...settings.rateProvider,
        lastError: error.name === 'AbortError' ? 'Rate refresh timed out' : error.message
      }
    });
  } finally {
    clearTimeout(timeout);
  }
};

const maybeRefreshRates = async (settings) => {
  if (!rateNeedsRefresh(settings)) return settings;
  return refreshExchangeRates();
};

export const detectCountry = (req) => {
  const directCountry = sanitizeCountryCode(req.query?.country);
  if (directCountry) return directCountry;

  const headerCountry = [
    headerValue(req, 'x-vercel-ip-country'),
    headerValue(req, 'cf-ipcountry'),
    headerValue(req, 'cloudfront-viewer-country'),
    headerValue(req, 'x-country-code')
  ]
    .map(sanitizeCountryCode)
    .find(Boolean);

  if (headerCountry) return headerCountry;

  const timezoneCountry = countryFromTimezone(req.query?.timezone || headerValue(req, 'x-timezone'));
  if (timezoneCountry) return timezoneCountry;

  return countryFromAcceptLanguage(headerValue(req, 'accept-language'));
};

export const currencyForCountry = (country) => {
  const code = sanitizeCountryCode(country);
  if (!code) return '';
  if (code === 'EU' || europeanCountries.has(code)) return 'EUR';
  return countryCurrencyMap[code] || '';
};

const enabledCurrencyMap = (settings) =>
  Object.fromEntries(settings.currencies.filter((currency) => currency.enabled).map((currency) => [currency.code, currency]));

export const resolveCurrency = (settings, req) => {
  const enabledCurrencies = enabledCurrencyMap(settings);
  const requested = sanitizeCurrencyCode(req.query?.currency || headerValue(req, 'x-lahventure-currency'));
  const detectedCountry = detectCountry(req);
  const detectedCurrency = settings.autoDetect ? currencyForCountry(detectedCountry) : '';
  const fallbackCurrency = enabledCurrencies[settings.fallbackCurrency] ? settings.fallbackCurrency : 'BDT';
  const currency =
    (requested && enabledCurrencies[requested] && requested) ||
    (detectedCurrency && enabledCurrencies[detectedCurrency] && detectedCurrency) ||
    fallbackCurrency;

  return {
    currency,
    detectedCountry,
    detectedCurrency,
    autoDetected: Boolean(!requested && detectedCurrency && currency === detectedCurrency)
  };
};

export const publicCurrencyPayload = async (req) => {
  const settings = await getCurrencySettings({ refreshRates: true });
  const resolved = resolveCurrency(settings, req);
  const activeCurrencies = settings.currencies.filter((currency) => currency.enabled);

  return {
    baseCurrency: settings.baseCurrency,
    currency: resolved.currency,
    autoDetect: settings.autoDetect,
    autoUpdateRates: settings.autoUpdateRates,
    fallbackCurrency: settings.fallbackCurrency,
    detectedCountry: resolved.detectedCountry,
    detectedCurrency: resolved.detectedCurrency,
    autoDetected: resolved.autoDetected,
    currencies: activeCurrencies,
    rates: Object.fromEntries(activeCurrencies.map((currency) => [currency.code, currency])),
    rateProvider: settings.rateProvider
  };
};

export const updateCurrencySettings = async (payload) => {
  const settings = await getCurrencySettings({ bypassCache: true });
  const next = clone(settings);

  if (payload.autoDetect !== undefined) next.autoDetect = Boolean(payload.autoDetect);
  if (payload.autoUpdateRates !== undefined) next.autoUpdateRates = Boolean(payload.autoUpdateRates);

  const requestedFallback = sanitizeCurrencyCode(payload.fallbackCurrency);
  if (requestedFallback) next.fallbackCurrency = requestedFallback;

  if (Array.isArray(payload.currencies)) {
    const incoming = new Map(payload.currencies.map((currency) => [sanitizeCurrencyCode(currency.code), currency]));
    next.currencies = settings.currencies.map((currency) => {
      const patch = incoming.get(currency.code);
      if (!patch) return currency;

      const bdtPerUnit = Number(patch.bdtPerUnit);
      return normalizeCurrency({
        ...currency,
        enabled: currency.code === 'BDT' ? true : patch.enabled ?? currency.enabled,
        bdtPerUnit: currency.code === 'BDT' ? 1 : Number.isFinite(bdtPerUnit) && bdtPerUnit > 0 ? bdtPerUnit : currency.bdtPerUnit,
        manualRate: currency.code === 'BDT' ? false : patch.manualRate ?? true,
        source: currency.code === 'BDT' ? 'base' : patch.manualRate === false ? (currency.source === 'manual' ? 'fallback' : currency.source) : 'manual',
        updatedAt: nowIso()
      });
    });
  } else if (isPlainObject(payload.currencies)) {
    next.currencies = settings.currencies.map((currency) => {
      const patch = payload.currencies[currency.code];
      if (!patch) return currency;
      const bdtPerUnit = Number(patch.bdtPerUnit);
      return normalizeCurrency({
        ...currency,
        enabled: currency.code === 'BDT' ? true : patch.enabled ?? currency.enabled,
        bdtPerUnit: currency.code === 'BDT' ? 1 : Number.isFinite(bdtPerUnit) && bdtPerUnit > 0 ? bdtPerUnit : currency.bdtPerUnit,
        manualRate: currency.code === 'BDT' ? false : patch.manualRate ?? true,
        source: currency.code === 'BDT' ? 'base' : patch.manualRate === false ? (currency.source === 'manual' ? 'fallback' : currency.source) : 'manual',
        updatedAt: nowIso()
      });
    });
  }

  return saveSettings(next);
};

export const convertFromBase = (amount, currency, settings) => {
  const code = sanitizeCurrencyCode(currency) || 'BDT';
  const rate = settings.currencies.find((item) => item.code === code && item.enabled);
  const bdtPerUnit = rate?.bdtPerUnit || 1;
  return Math.round((Number(amount || 0) / bdtPerUnit) * 100) / 100;
};
