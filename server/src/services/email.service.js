import { Resend } from 'resend';
import { env } from '../config/env.js';

let resendClient;
let warnedMissingConfig = false;
let warnedMissingAdminRecipient = false;

const normalizeRecipients = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const warnOnce = (message, key) => {
  if (env.nodeEnv === 'test') return;

  if (key === 'config') {
    if (warnedMissingConfig) return;
    warnedMissingConfig = true;
  }

  if (key === 'admin') {
    if (warnedMissingAdminRecipient) return;
    warnedMissingAdminRecipient = true;
  }

  console.warn(message);
};

const getResendClient = () => {
  if (!env.email.resendApiKey) return null;
  if (!resendClient) resendClient = new Resend(env.email.resendApiKey);
  return resendClient;
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const humanize = (value = '') =>
  String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatMoney = (value = 0) => {
  const amount = Number(value) || 0;

  try {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `BDT ${amount.toFixed(0)}`;
  }
};

const toValidDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = toValidDate(value);
  if (!date) return '';

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka'
  }).format(date);
};

const formatDateOnly = (value) => {
  const date = toValidDate(value);
  if (!date) return '';

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeZone: 'Asia/Dhaka'
  }).format(date);
};

const getOrderNumber = (order) => order?.orderNumber || order?._id?.toString?.() || order?.id || 'your order';

const getBaseUrl = () => env.clientUrl.replace(/\/+$/, '');

const getLogoUrl = () => env.email.logoUrl || `${getBaseUrl()}/lahventure.png`;

const getOrderUrl = (order) => `${getBaseUrl()}/orders/${encodeURIComponent(getOrderNumber(order))}`;

const getAdminOrdersUrl = () => `${getBaseUrl()}/admin/orders`;

const BRAND_COLOR = '#6b000b';
const BRAND_DARK = '#4a0006';
const TEXT_COLOR = '#111827';
const MUTED_COLOR = '#6b7280';
const BORDER_COLOR = '#e5e7eb';
const PANEL_BG = '#f9fafb';

const getCustomer = (order) => ({
  name: order?.customerSnapshot?.name || order?.shippingAddress?.fullName || order?.user?.name || 'Customer',
  email: order?.customerSnapshot?.email || order?.user?.email || '',
  phone: order?.customerSnapshot?.phone || order?.shippingAddress?.phone || order?.user?.phone || ''
});

const getVariantSummary = (variant) => {
  const entries = variant instanceof Map ? Array.from(variant.entries()) : Object.entries(variant || {});

  return entries
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${humanize(key)}: ${value}`)
    .join(', ');
};

const formatAddress = (address = {}) => {
  const lines = [
    address.fullName,
    address.phone,
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(', '),
    address.country
  ]
    .filter(Boolean)
    .join('\n');

  return lines || 'Unavailable';
};

const htmlAddress = (address = {}) =>
  formatAddress(address)
    .split('\n')
    .map((line) => escapeHtml(line))
    .join('<br />');

const pricingRows = (pricing = {}) => {
  const discount = Number(pricing.discount) || 0;

  return [
    ['Subtotal', pricing.subtotal],
    discount ? ['Discount', -Math.abs(discount)] : null,
    ['Tax', pricing.tax],
    ['Shipping', pricing.shipping],
    ['Total', pricing.total]
  ].filter(Boolean);
};

const PAYMENT_METHOD_LABELS = {
  card: 'Card',
  cash_on_delivery: 'Cash on delivery',
  paypal: 'PayPal',
  stripe: 'Stripe'
};

const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  authorized: 'Authorized',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded'
};

const formatPaymentMethod = (method = '') => PAYMENT_METHOD_LABELS[method] || (method ? humanize(method) : 'Unavailable');

const formatPaymentStatus = (status = '') => PAYMENT_STATUS_LABELS[status] || (status ? humanize(status) : 'Pending');

const paymentSummary = (payment = {}) =>
  `${formatPaymentMethod(payment.method)} (${formatPaymentStatus(payment.status)})`;

const sectionTitle = (title) =>
  `<h2 style="margin:28px 0 10px;font-size:16px;line-height:1.3;color:${TEXT_COLOR};">${escapeHtml(title)}</h2>`;

const actionButton = (href, label, color = BRAND_COLOR) => `
  <p style="margin:24px 0 0;">
    <a href="${escapeHtml(href)}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:4px;font-size:14px;font-weight:700;line-height:1.2;">${escapeHtml(label)}</a>
  </p>
`;

const summaryPanelHtml = (rows) => {
  const body = rows
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 0;color:${MUTED_COLOR};font-size:13px;line-height:1.4;">${escapeHtml(label)}</td>
          <td style="padding:8px 0;color:${TEXT_COLOR};font-size:14px;line-height:1.4;font-weight:700;text-align:right;">${escapeHtml(value)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:${PANEL_BG};border:1px solid ${BORDER_COLOR};border-radius:6px;margin:18px 0 20px;">
      <tbody>
        <tr>
          <td style="padding:10px 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              <tbody>${body}</tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  `;
};

const notePanelHtml = (title, note, tone = 'neutral') => {
  if (!note) return '';

  const isWarning = tone === 'warning';
  const border = isWarning ? '#fecaca' : '#d1d5db';
  const background = isWarning ? '#fef2f2' : PANEL_BG;
  const titleColor = isWarning ? '#991b1b' : TEXT_COLOR;

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:${background};border:1px solid ${border};border-radius:6px;margin:18px 0;">
      <tr>
        <td style="padding:14px 16px;">
          <p style="margin:0 0 4px;color:${titleColor};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">${escapeHtml(title)}</p>
          <p style="margin:0;color:#374151;font-size:14px;line-height:1.5;">${escapeHtml(note)}</p>
        </td>
      </tr>
    </table>
  `;
};

const deliveryDetailsHtml = (order, expectedDate) => `
  ${sectionTitle('Delivery details')}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid ${BORDER_COLOR};border-radius:6px;">
    <tr>
      <td width="58%" style="padding:16px;vertical-align:top;border-right:1px solid ${BORDER_COLOR};">
        <p style="margin:0 0 6px;color:${MUTED_COLOR};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Ship to</p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.5;">${htmlAddress(order.shippingAddress)}</p>
      </td>
      <td width="42%" style="padding:16px;vertical-align:top;">
        <p style="margin:0 0 6px;color:${MUTED_COLOR};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Expected arrival</p>
        <p style="margin:0;color:${TEXT_COLOR};font-size:14px;line-height:1.5;font-weight:700;">${escapeHtml(expectedDate || 'Within 7 days')}</p>
      </td>
    </tr>
  </table>
`;

const orderItemsHtml = (order) => {
  const rows = (order?.items || [])
    .map((item) => {
      const variant = getVariantSummary(item.variant);
      const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);

      return `
        <tr>
          <td style="padding:12px 8px 12px 0;border-bottom:1px solid ${BORDER_COLOR};">
            <strong style="color:${TEXT_COLOR};">${escapeHtml(item.name)}</strong>
            ${item.sku ? `<br /><span style="color:${MUTED_COLOR};font-size:12px;">SKU ${escapeHtml(item.sku)}</span>` : ''}
            ${variant ? `<br /><span style="color:${MUTED_COLOR};font-size:12px;">${escapeHtml(variant)}</span>` : ''}
          </td>
          <td style="padding:12px 6px;border-bottom:1px solid ${BORDER_COLOR};text-align:center;color:#374151;">${escapeHtml(item.quantity)}</td>
          <td style="padding:12px 6px;border-bottom:1px solid ${BORDER_COLOR};text-align:right;color:#374151;">${escapeHtml(formatMoney(item.price))}</td>
          <td style="padding:12px 0 12px 6px;border-bottom:1px solid ${BORDER_COLOR};text-align:right;color:${TEXT_COLOR};font-weight:700;">${escapeHtml(formatMoney(lineTotal))}</td>
        </tr>
      `;
    })
    .join('');

  if (!rows) {
    return `
      ${sectionTitle('Items')}
      <p style="margin:0;color:${MUTED_COLOR};font-size:14px;">No order items were available for this email.</p>
    `;
  }

  const totals = pricingRows(order?.pricing)
    .map(([label, amount]) => {
      const isTotal = label === 'Total';
      return `
        <tr>
          <td colspan="3" style="padding:${isTotal ? '12px' : '6px'} 8px 6px 0;text-align:right;${isTotal ? `font-weight:700;font-size:16px;color:${TEXT_COLOR};` : 'color:#4b5563;font-size:14px;'}">${escapeHtml(label)}</td>
          <td style="padding:${isTotal ? '12px' : '6px'} 0 6px 6px;text-align:right;${isTotal ? `font-weight:700;font-size:16px;color:${TEXT_COLOR};` : 'color:#374151;font-size:14px;'}">${escapeHtml(formatMoney(amount))}</td>
        </tr>
      `;
    })
    .join('');

  return `
    ${sectionTitle('Items')}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:8px;font-size:14px;">
      <thead>
        <tr>
          <th align="left" style="padding:0 8px 8px 0;border-bottom:1px solid ${TEXT_COLOR};color:${TEXT_COLOR};font-size:12px;text-transform:uppercase;letter-spacing:0.4px;">Item</th>
          <th align="center" style="padding:0 6px 8px;border-bottom:1px solid ${TEXT_COLOR};color:${TEXT_COLOR};font-size:12px;text-transform:uppercase;letter-spacing:0.4px;">Qty</th>
          <th align="right" style="padding:0 6px 8px;border-bottom:1px solid ${TEXT_COLOR};color:${TEXT_COLOR};font-size:12px;text-transform:uppercase;letter-spacing:0.4px;">Price</th>
          <th align="right" style="padding:0 0 8px 6px;border-bottom:1px solid ${TEXT_COLOR};color:${TEXT_COLOR};font-size:12px;text-transform:uppercase;letter-spacing:0.4px;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>${totals}</tfoot>
    </table>
  `;
};

const orderItemsText = (order) => {
  const itemLines = (order?.items || [])
    .map((item) => {
      const variant = getVariantSummary(item.variant);
      const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
      return `- ${item.name} x ${item.quantity}${variant ? ` (${variant})` : ''}: ${formatMoney(lineTotal)}`;
    })
    .join('\n');

  const totalLines = pricingRows(order?.pricing)
    .map(([label, amount]) => `${label}: ${formatMoney(amount)}`)
    .join('\n');

  return [itemLines, totalLines].filter(Boolean).join('\n\n');
};

const emailLayout = ({ title, preview, content }) => `
  <!doctype html>
  <html>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:${TEXT_COLOR};">
      <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHtml(preview)}</span>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f3f4f6;">
        <tr>
          <td align="center" style="padding:28px 12px;">
            <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;border-collapse:collapse;background:#ffffff;border:1px solid ${BORDER_COLOR};border-radius:8px;overflow:hidden;">
              <tr>
                <td style="padding:24px;background:${BRAND_DARK};color:#ffffff;">
                  <img src="${escapeHtml(getLogoUrl())}" width="64" height="64" alt="${escapeHtml(env.email.storeName)}" style="display:block;width:64px;height:64px;object-fit:contain;margin:0 0 14px;border-radius:4px;" />
                  <div style="font-size:12px;letter-spacing:0.7px;text-transform:uppercase;color:#f3d8dc;font-weight:700;">${escapeHtml(env.email.storeName)}</div>
                  <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;font-weight:700;color:#ffffff;">${escapeHtml(title)}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:26px 24px 28px;font-size:15px;line-height:1.6;color:${TEXT_COLOR};">
                  ${content}
                  <p style="margin:30px 0 0;color:${MUTED_COLOR};font-size:14px;line-height:1.5;">Thanks,<br /><strong style="color:${TEXT_COLOR};">${escapeHtml(env.email.storeName)}</strong></p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 24px;background:${PANEL_BG};border-top:1px solid ${BORDER_COLOR};color:${MUTED_COLOR};font-size:12px;line-height:1.5;">
                  Keep this email for your records. For support, reply with your order number.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;

const buildCustomerOrderEmail = (order) => {
  const orderNumber = getOrderNumber(order);
  const customer = getCustomer(order);
  const orderUrl = getOrderUrl(order);
  const createdAt = formatDate(order.createdAt);
  const expectedDate = formatDateOnly(order.expectedDeliveryDate);
  const payment = paymentSummary(order.payment);
  const isCashOnDelivery = order.payment?.method === 'cash_on_delivery';

  const html = emailLayout({
    title: `We received order ${orderNumber}`,
    preview: `Your ${env.email.storeName} order ${orderNumber} is in our queue.`,
    content: `
      <p style="margin:0 0 16px;">Hi ${escapeHtml(customer.name)},</p>
      <p style="margin:0 0 16px;">Thank you for shopping with ${escapeHtml(env.email.storeName)}. Your order has been received and our team will review it before fulfillment starts.</p>
      ${summaryPanelHtml([
        ['Order number', orderNumber],
        ['Placed', createdAt],
        ['Payment', payment],
        ['Total', formatMoney(order.pricing?.total)]
      ])}
      ${
        isCashOnDelivery
          ? notePanelHtml('Payment note', 'This is a cash on delivery order. Payment will be collected when your order arrives.')
          : ''
      }
      ${orderItemsHtml(order)}
      ${deliveryDetailsHtml(order, expectedDate)}
      <p style="margin:22px 0 0;color:${MUTED_COLOR};font-size:14px;">We will email you again when the order status changes.</p>
      ${actionButton(orderUrl, 'View order')}
    `
  });

  const text = [
    `Hi ${customer.name},`,
    `Thank you for shopping with ${env.email.storeName}. Your order has been received and our team will review it before fulfillment starts.`,
    `Order number: ${orderNumber}`,
    createdAt ? `Placed: ${createdAt}` : '',
    `Payment: ${payment}`,
    `Total: ${formatMoney(order.pricing?.total)}`,
    isCashOnDelivery ? 'Payment note: This is a cash on delivery order. Payment will be collected when your order arrives.' : '',
    orderItemsText(order),
    `Expected arrival: ${expectedDate || 'Within 7 days'}`,
    `Ship to:\n${formatAddress(order.shippingAddress)}`,
    `View order: ${orderUrl}`
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    to: customer.email,
    subject: `We received your order ${orderNumber}`,
    html,
    text
  };
};

const buildAdminOrderEmail = (order) => {
  const orderNumber = getOrderNumber(order);
  const customer = getCustomer(order);
  const adminUrl = getAdminOrdersUrl();
  const createdAt = formatDate(order.createdAt);
  const expectedDate = formatDateOnly(order.expectedDeliveryDate);
  const customerNote = order.customerNote ? String(order.customerNote).trim() : '';

  const html = emailLayout({
    title: `New order ${orderNumber}`,
    preview: `${customer.name} placed a ${formatMoney(order.pricing?.total)} order on ${env.email.storeName}.`,
    content: `
      <p style="margin:0 0 16px;">A customer placed a new order. Review payment, inventory, delivery details, and any customer note before fulfillment.</p>
      ${summaryPanelHtml([
        ['Order number', orderNumber],
        ['Order total', formatMoney(order.pricing?.total)],
        ['Status', humanize(order.status || 'pending')],
        ['Payment', paymentSummary(order.payment)],
        ['Placed', createdAt],
        ['Expected arrival', expectedDate || 'Within 7 days']
      ])}
      ${sectionTitle('Customer')}
      ${summaryPanelHtml([
        ['Name', customer.name],
        ['Email', customer.email || 'Unavailable'],
        ['Phone', customer.phone || 'Unavailable']
      ])}
      ${orderItemsHtml(order)}
      ${deliveryDetailsHtml(order, expectedDate)}
      ${notePanelHtml('Customer note', customerNote)}
      ${actionButton(adminUrl, 'Open admin orders', TEXT_COLOR)}
    `
  });

  const text = [
    `New order ${orderNumber}`,
    `Customer: ${customer.name}`,
    `Email: ${customer.email || 'Unavailable'}`,
    `Phone: ${customer.phone || 'Unavailable'}`,
    `Total: ${formatMoney(order.pricing?.total)}`,
    `Payment: ${paymentSummary(order.payment)}`,
    `Status: ${humanize(order.status || 'pending')}`,
    createdAt ? `Placed: ${createdAt}` : '',
    `Expected arrival: ${expectedDate || 'Within 7 days'}`,
    orderItemsText(order),
    `Ship to:\n${formatAddress(order.shippingAddress)}`,
    customerNote ? `Customer note:\n${customerNote}` : '',
    `Admin orders: ${adminUrl}`
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    to: env.email.adminTo,
    subject: `New order ${orderNumber}: ${formatMoney(order.pricing?.total)}`,
    html,
    text,
    replyTo: customer.email || env.email.replyTo || undefined
  };
};

const ORDER_STATUS_STEPS = [
  ['pending', 'Placed', 'Your order is in our system.'],
  ['confirmed', 'Confirmed', 'The order has been reviewed.'],
  ['processing', 'Preparing', 'The items are being prepared and packed.'],
  ['shipped', 'Shipped', 'The order is on the way.'],
  ['delivered', 'Delivered', 'The order has arrived.']
];

const STATUS_STEP_INDEX = ORDER_STATUS_STEPS.reduce((steps, [status], index) => {
  steps[status] = index;
  return steps;
}, {});

const getStatusCopy = (status, orderNumber) => {
  const copy = {
    pending: {
      title: 'Order received',
      description: 'Your order is in our queue. We will confirm it before fulfillment starts.',
      preview: `Order ${orderNumber} is waiting for confirmation.`,
      subject: `Order ${orderNumber}: order received`
    },
    confirmed: {
      title: 'Order confirmed',
      description: 'Your order has been confirmed and will move into preparation next.',
      preview: `Order ${orderNumber} has been confirmed.`,
      subject: `Order ${orderNumber}: confirmed`
    },
    processing: {
      title: 'We are preparing your order',
      description: 'Your items are being prepared and packed for delivery.',
      preview: `Order ${orderNumber} is being prepared.`,
      subject: `Order ${orderNumber}: preparing for delivery`
    },
    shipped: {
      title: 'Your order has shipped',
      description: 'Your order has left our store and is on the way to your delivery address.',
      preview: `Order ${orderNumber} has shipped.`,
      subject: `Order ${orderNumber}: shipped`
    },
    delivered: {
      title: 'Order delivered',
      description: 'Your order has been marked as delivered. We hope everything arrived in good condition.',
      preview: `Order ${orderNumber} has been delivered.`,
      subject: `Order ${orderNumber}: delivered`
    },
    cancelled: {
      title: 'Order cancelled',
      description: 'Your order has been cancelled. If this does not look right, reply with your order number so we can check it.',
      preview: `Order ${orderNumber} has been cancelled.`,
      subject: `Order ${orderNumber}: cancelled`
    },
    refunded: {
      title: 'Order refunded',
      description: 'Your order has been refunded. The money should appear based on your payment provider or bank timeline.',
      preview: `Order ${orderNumber} has been refunded.`,
      subject: `Order ${orderNumber}: refunded`
    }
  };

  return (
    copy[status] || {
      title: 'Order status updated',
      description: `Your order status is now ${humanize(status || 'pending')}.`,
      preview: `Order ${orderNumber} status was updated.`,
      subject: `Order ${orderNumber}: status updated`
    }
  );
};

const orderProgressHtml = (status) => {
  const activeIndex = STATUS_STEP_INDEX[status];
  if (activeIndex === undefined) return '';

  const rows = ORDER_STATUS_STEPS.map(([, label, description], index) => {
    const isComplete = index < activeIndex;
    const isCurrent = index === activeIndex;
    const circleBackground = isComplete || isCurrent ? BRAND_COLOR : '#ffffff';
    const circleBorder = isComplete || isCurrent ? BRAND_COLOR : '#cbd5e1';
    const circleColor = isComplete || isCurrent ? '#ffffff' : MUTED_COLOR;
    const state = isComplete ? 'Complete' : isCurrent ? 'Current' : 'Next';
    const labelColor = isComplete || isCurrent ? TEXT_COLOR : MUTED_COLOR;

    return `
      <tr>
        <td width="40" style="padding:10px 10px 10px 0;vertical-align:top;">
          <div style="width:28px;height:28px;line-height:28px;border-radius:14px;background:${circleBackground};border:1px solid ${circleBorder};color:${circleColor};font-size:12px;font-weight:700;text-align:center;">${index + 1}</div>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${index === ORDER_STATUS_STEPS.length - 1 ? 'transparent' : BORDER_COLOR};vertical-align:top;">
          <p style="margin:0;color:${labelColor};font-size:14px;font-weight:700;line-height:1.4;">${escapeHtml(label)} <span style="color:${isCurrent ? BRAND_COLOR : MUTED_COLOR};font-size:12px;font-weight:700;">${escapeHtml(state)}</span></p>
          <p style="margin:2px 0 0;color:${MUTED_COLOR};font-size:13px;line-height:1.4;">${escapeHtml(description)}</p>
        </td>
      </tr>
    `;
  }).join('');

  return `
    ${sectionTitle('Order progress')}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:${PANEL_BG};border:1px solid ${BORDER_COLOR};border-radius:6px;">
      <tr>
        <td style="padding:6px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            <tbody>${rows}</tbody>
          </table>
        </td>
      </tr>
    </table>
  `;
};

const buildCustomerStatusEmail = (order, options = {}) => {
  const orderNumber = getOrderNumber(order);
  const customer = getCustomer(order);
  const orderUrl = getOrderUrl(order);
  const status = order.status || 'pending';
  const note = options.note ? String(options.note).trim() : '';
  const expectedDate = formatDateOnly(order.expectedDeliveryDate) || formatDateOnly(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const detailsChanged = Boolean(options.detailsChanged);
  const isDetailsOnlyUpdate = options.reason === 'details' || (detailsChanged && options.reason !== 'status');
  const statusCopy = getStatusCopy(status, orderNumber);
  const copy = isDetailsOnlyUpdate
    ? {
        title: 'Delivery details updated',
        description: 'The delivery details for your order were updated. Please review the address and expected arrival below.',
        preview: `Delivery details changed for order ${orderNumber}.`,
        subject: `Delivery details updated for order ${orderNumber}`
      }
    : statusCopy;

  const html = emailLayout({
    title: copy.title,
    preview: copy.preview,
    content: `
      <p style="margin:0 0 16px;">Hi ${escapeHtml(customer.name)},</p>
      <p style="margin:0 0 16px;">${escapeHtml(copy.description)}</p>
      ${summaryPanelHtml([
        ['Order number', orderNumber],
        ['Current status', humanize(status)],
        ['Expected arrival', expectedDate],
        ['Payment', paymentSummary(order.payment)]
      ])}
      ${
        isDetailsOnlyUpdate
          ? ''
          : orderProgressHtml(status)
      }
      ${
        detailsChanged && !isDetailsOnlyUpdate
          ? notePanelHtml('Delivery details updated', 'The delivery details were also updated. Review the latest address and expected arrival below.')
          : ''
      }
      ${notePanelHtml('Note from shop', note)}
      ${deliveryDetailsHtml(order, expectedDate)}
      ${orderItemsHtml(order)}
      ${actionButton(orderUrl, 'View order')}
    `
  });

  const text = [
    `Hi ${customer.name},`,
    copy.description,
    `Order number: ${orderNumber}`,
    `Current status: ${humanize(status)}`,
    `Expected arrival: ${expectedDate}`,
    `Payment: ${paymentSummary(order.payment)}`,
    detailsChanged && !isDetailsOnlyUpdate ? 'Delivery details were also updated. Review the latest address and expected arrival below.' : '',
    note ? `Note from shop: ${note}` : '',
    `Ship to:\n${formatAddress(order.shippingAddress)}`,
    orderItemsText(order),
    `View order: ${orderUrl}`
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    to: customer.email,
    subject: copy.subject,
    html,
    text
  };
};

export const sendTransactionalEmail = async ({ to, subject, html, text, replyTo }) => {
  const recipients = normalizeRecipients(to);
  if (!recipients.length) return { skipped: true, reason: 'missing_recipient' };

  const client = getResendClient();
  if (!client || !env.email.from) {
    warnOnce('Email delivery skipped. Configure RESEND_API_KEY and EMAIL_FROM to enable Resend emails.', 'config');
    return { skipped: true, reason: 'missing_config' };
  }

  try {
    const { data, error } = await client.emails.send({
      from: env.email.from,
      to: recipients,
      subject,
      html,
      text,
      replyTo: replyTo || env.email.replyTo || undefined
    });

    if (error) {
      console.error('Resend email failed:', error);
      return { error };
    }

    return { data };
  } catch (error) {
    console.error('Resend email failed:', error);
    return { error };
  }
};

export const sendOrderCreatedEmails = async (order) => {
  const customerEmail = buildCustomerOrderEmail(order);
  const tasks = [sendTransactionalEmail(customerEmail)];

  if (env.email.adminTo.length) {
    tasks.push(sendTransactionalEmail(buildAdminOrderEmail(order)));
  } else {
    warnOnce('Admin order email skipped. Configure EMAIL_ADMIN_TO with one or more admin email addresses.', 'admin');
  }

  await Promise.all(tasks);
};

export const sendOrderStatusEmail = async (order, options = {}) => {
  await sendTransactionalEmail(buildCustomerStatusEmail(order, options));
};
