import { PaymentSetting } from '../models/paymentSetting.model.js';

export const MANUAL_PAYMENT_METHODS = ['cash_on_delivery', 'bank_transfer', 'mobile_banking'];
const GLOBAL_PAYMENT_KEY = 'global_payment_settings';
const SETTINGS_CACHE_MS = 60 * 1000;

let settingsCache = {
  value: null,
  cachedAt: 0
};

const clone = (value) => JSON.parse(JSON.stringify(value || {}));

const asPlain = (doc) => (typeof doc?.toObject === 'function' ? doc.toObject() : doc);

const defaultSettings = () => ({
  key: GLOBAL_PAYMENT_KEY,
  methods: {
    cash_on_delivery: {
      enabled: true,
      label: 'Cash on delivery',
      instructions: 'Place the order now and pay in cash when your order arrives.'
    },
    bank_transfer: {
      enabled: true,
      label: 'Bank transfer',
      accountName: 'lahVenture',
      accountNumber: '',
      bankName: '',
      district: '',
      branchName: '',
      routingNumber: '',
      instructions: 'Transfer the order total to the bank account, then submit your sender account number and transaction ID if available.'
    },
    mobile_banking: {
      enabled: true,
      label: 'Mobile banking',
      providerName: '',
      paymentType: '',
      accountName: 'lahVenture',
      accountNumber: '',
      instructions: 'Send the order total to the mobile banking number, then submit your sender account number and transaction ID if available.'
    }
  }
});

const normalizeMethod = (key, method = {}) => {
  const fallback = defaultSettings().methods[key] || {};

  return {
    ...fallback,
    ...clone(method),
    enabled: method.enabled !== false,
    label: String(method.label || fallback.label || '').trim(),
    accountName: String(method.accountName || '').trim(),
    accountNumber: String(method.accountNumber || '').trim(),
    bankName: String(method.bankName || '').trim(),
    district: String(method.district || '').trim(),
    branchName: String(method.branchName || '').trim(),
    routingNumber: String(method.routingNumber || '').trim(),
    providerName: String(method.providerName || '').trim(),
    paymentType: String(method.paymentType || '').trim(),
    instructions: String(method.instructions || fallback.instructions || '').trim()
  };
};

const normalizeSettings = (settings = {}) => {
  const methods = {};
  for (const key of MANUAL_PAYMENT_METHODS) {
    methods[key] = normalizeMethod(key, settings.methods?.[key]);
  }

  return {
    ...defaultSettings(),
    ...clone(settings),
    key: GLOBAL_PAYMENT_KEY,
    methods
  };
};

const setCache = (settings) => {
  settingsCache = {
    value: normalizeSettings(settings),
    cachedAt: Date.now()
  };
  return settingsCache.value;
};

const findRawSettings = async () => PaymentSetting.findOne({ key: GLOBAL_PAYMENT_KEY });

const saveSettings = async (settings) => {
  const normalized = normalizeSettings(settings);
  let doc = await findRawSettings();

  if (!doc) {
    doc = await PaymentSetting.create(normalized);
  } else if (typeof doc.save === 'function') {
    doc.methods = normalized.methods;
    await doc.save();
  } else {
    await PaymentSetting.findByIdAndUpdate(doc._id, normalized, { new: true });
  }

  return setCache(normalized);
};

export const getPaymentSettings = async ({ bypassCache = false } = {}) => {
  if (!bypassCache && settingsCache.value && Date.now() - settingsCache.cachedAt < SETTINGS_CACHE_MS) {
    return settingsCache.value;
  }

  const existing = await findRawSettings();
  return existing ? setCache(asPlain(existing)) : saveSettings(defaultSettings());
};

export const getPaymentMethod = async (methodKey) => {
  const settings = await getPaymentSettings();
  return settings.methods?.[methodKey] || null;
};

export const updatePaymentSettings = async (payload = {}) => {
  const settings = await getPaymentSettings({ bypassCache: true });
  const next = clone(settings);

  for (const key of MANUAL_PAYMENT_METHODS) {
    if (!payload.methods?.[key]) continue;
    next.methods[key] = {
      ...next.methods[key],
      ...payload.methods[key]
    };
  }

  return saveSettings(next);
};

export const publicPaymentSettings = async () => {
  const settings = await getPaymentSettings();
  return {
    methods: MANUAL_PAYMENT_METHODS.map((key) => ({
      key,
      ...settings.methods[key]
    })).filter((method) => method.enabled)
  };
};
