export const paymentMethodLabels = {
  cash_on_delivery: 'Cash on delivery',
  bank_transfer: 'Bank transfer',
  mobile_banking: 'Mobile banking',
  card: 'Card',
  paypal: 'PayPal',
  stripe: 'Stripe'
};

export const paymentStatusLabels = {
  pending: 'Pending',
  submitted: 'Submitted',
  authorized: 'Authorized',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded'
};

export const manualPaymentMethods = new Set(['bank_transfer', 'mobile_banking']);

export const paymentMethodLabel = (value) => paymentMethodLabels[value] || value || 'Unavailable';

export const paymentStatusLabel = (value) => paymentStatusLabels[value] || value || 'Pending';

export const requiresManualPaymentDetails = (method) => manualPaymentMethods.has(method);

export const paymentMethodSummary = (method = {}) =>
  [
    method.providerName,
    method.paymentType,
    method.bankName,
    method.district,
    method.accountName,
    method.accountNumber ? `Account: ${method.accountNumber}` : ''
  ]
    .filter(Boolean)
    .join(' · ');
