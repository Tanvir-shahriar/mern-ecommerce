export const formatCurrencyAmount = (value = 0, currency = 'BDT', locale = 'en-BD', maximumFractionDigits) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: maximumFractionDigits ?? (currency === 'BDT' ? 0 : 2)
  }).format(value);

export const money = (value = 0) => formatCurrencyAmount(value, 'BDT', 'en-BD', 0);

export const dateShort = (value) =>
  value
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(new Date(value))
    : '';

export const statusLabel = (value = '') =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
