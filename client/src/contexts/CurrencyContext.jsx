import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { formatCurrencyAmount, money as formatBaseCurrency } from '../utils/format.js';

const CurrencyContext = createContext(null);
const STORAGE_KEY = 'lahventure_currency';

const timezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    return '';
  }
};

const normalizeCode = (value) => String(value || '').trim().toUpperCase();

const fallbackRate = {
  code: 'BDT',
  name: 'Bangladeshi Taka',
  symbol: '৳',
  locale: 'en-BD',
  enabled: true,
  bdtPerUnit: 1
};

export const CurrencyProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [currency, setCurrencyState] = useState(() => normalizeCode(window.localStorage.getItem(STORAGE_KEY)) || 'BDT');
  const [loading, setLoading] = useState(true);

  const fetchCurrency = useCallback(async () => {
    setLoading(true);
    try {
      const storedCurrency = normalizeCode(window.localStorage.getItem(STORAGE_KEY));
      const { data } = await api.get('/currency', {
        params: {
          currency: storedCurrency || undefined,
          timezone: timezone() || undefined
        }
      });
      const payload = data.data;
      setSettings(payload);
      setCurrencyState(storedCurrency && payload.rates?.[storedCurrency] ? storedCurrency : payload.currency || 'BDT');
      return payload;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrency().catch(() => {
      setSettings({
        baseCurrency: 'BDT',
        currency: 'BDT',
        currencies: [fallbackRate],
        rates: { BDT: fallbackRate }
      });
      setCurrencyState('BDT');
      setLoading(false);
    });
  }, [fetchCurrency]);

  const activeRate = settings?.rates?.[currency] || settings?.rates?.BDT || fallbackRate;
  const currencies = settings?.currencies?.length ? settings.currencies : [fallbackRate];

  const setCurrency = useCallback(
    (nextCurrency) => {
      const code = normalizeCode(nextCurrency);
      if (!settings?.rates?.[code]) return;
      window.localStorage.setItem(STORAGE_KEY, code);
      setCurrencyState(code);
    },
    [settings]
  );

  const clearCurrencyOverride = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    fetchCurrency();
  }, [fetchCurrency]);

  const convertFromBase = useCallback(
    (amount) => {
      const bdtPerUnit = Number(activeRate?.bdtPerUnit) || 1;
      return Math.round((Number(amount || 0) / bdtPerUnit) * 100) / 100;
    },
    [activeRate]
  );

  const convertToBase = useCallback(
    (amount) => {
      const bdtPerUnit = Number(activeRate?.bdtPerUnit) || 1;
      return Math.round(Number(amount || 0) * bdtPerUnit * 100) / 100;
    },
    [activeRate]
  );

  const formatMoney = useCallback(
    (amount, options = {}) => {
      const code = options.currency || activeRate?.code || currency || 'BDT';
      const rate = settings?.rates?.[code] || activeRate || fallbackRate;
      const converted = code === 'BDT' ? Number(amount || 0) : Math.round((Number(amount || 0) / (Number(rate.bdtPerUnit) || 1)) * 100) / 100;
      return formatCurrencyAmount(converted, code, rate.locale || activeRate?.locale || 'en-BD', options.maximumFractionDigits);
    },
    [activeRate, currency, settings]
  );

  const value = useMemo(
    () => ({
      loading,
      settings,
      currency,
      activeRate,
      currencies,
      setCurrency,
      clearCurrencyOverride,
      refreshCurrency: fetchCurrency,
      convertFromBase,
      convertToBase,
      formatMoney,
      formatBaseMoney: formatBaseCurrency
    }),
    [
      activeRate,
      clearCurrencyOverride,
      convertFromBase,
      convertToBase,
      currencies,
      currency,
      fetchCurrency,
      formatMoney,
      loading,
      setCurrency,
      settings
    ]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => useContext(CurrencyContext);
