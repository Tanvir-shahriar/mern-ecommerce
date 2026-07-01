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

const formatDate = (value) => {
  if (!value) return '';

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka'
  }).format(new Date(value));
};

const getOrderNumber = (order) => order?.orderNumber || order?._id?.toString?.() || order?.id || 'your order';

const getBaseUrl = () => env.clientUrl.replace(/\/+$/, '');

const getLogoUrl = () => env.email.logoUrl || `${getBaseUrl()}/lahventure.png`;

const getOrderUrl = (order) => `${getBaseUrl()}/orders/${encodeURIComponent(getOrderNumber(order))}`;

const getAdminOrdersUrl = () => `${getBaseUrl()}/admin/orders`;

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

const formatAddress = (address = {}) =>
  [
    address.fullName,
    address.phone,
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(', '),
    address.country
  ]
    .filter(Boolean)
    .join('\n');

const htmlAddress = (address = {}) =>
  formatAddress(address)
    .split('\n')
    .map((line) => escapeHtml(line))
    .join('<br />');

const pricingRows = (pricing = {}) =>
  [
    ['Subtotal', pricing.subtotal],
    pricing.discount ? ['Discount', -Math.abs(pricing.discount)] : null,
    ['Tax', pricing.tax],
    ['Shipping', pricing.shipping],
    ['Total', pricing.total]
  ].filter(Boolean);

const orderItemsHtml = (order) => {
  const rows = (order?.items || [])
    .map((item) => {
      const variant = getVariantSummary(item.variant);
      const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);

      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
            <strong>${escapeHtml(item.name)}</strong>
            ${item.sku ? `<br /><span style="color:#6b7280;font-size:13px;">SKU ${escapeHtml(item.sku)}</span>` : ''}
            ${variant ? `<br /><span style="color:#6b7280;font-size:13px;">${escapeHtml(variant)}</span>` : ''}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:center;">${escapeHtml(item.quantity)}</td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(formatMoney(item.price))}</td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(formatMoney(lineTotal))}</td>
        </tr>
      `;
    })
    .join('');

  const totals = pricingRows(order?.pricing)
    .map(([label, amount]) => {
      const isTotal = label === 'Total';
      return `
        <tr>
          <td colspan="3" style="padding:6px 0;text-align:right;${isTotal ? 'font-weight:700;font-size:16px;' : 'color:#4b5563;'}">${escapeHtml(label)}</td>
          <td style="padding:6px 0;text-align:right;${isTotal ? 'font-weight:700;font-size:16px;' : ''}">${escapeHtml(formatMoney(amount))}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:16px;">
      <thead>
        <tr>
          <th align="left" style="padding-bottom:8px;border-bottom:1px solid #111827;">Item</th>
          <th align="center" style="padding-bottom:8px;border-bottom:1px solid #111827;">Qty</th>
          <th align="right" style="padding-bottom:8px;border-bottom:1px solid #111827;">Price</th>
          <th align="right" style="padding-bottom:8px;border-bottom:1px solid #111827;">Total</th>
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
  <div style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHtml(preview)}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f3f4f6;padding:24px 0;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:24px;background:#111827;color:#ffffff;">
                <img src="${escapeHtml(getLogoUrl())}" width="72" height="72" alt="${escapeHtml(env.email.storeName)}" style="display:block;width:72px;height:72px;object-fit:contain;margin:0 0 14px;" />
                <div style="font-size:13px;letter-spacing:0;text-transform:uppercase;color:#d1d5db;">${escapeHtml(env.email.storeName)}</div>
                <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;font-size:15px;line-height:1.6;">
                ${content}
                <p style="margin:28px 0 0;color:#4b5563;">Thanks,<br />${escapeHtml(env.email.storeName)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;

const buildCustomerOrderEmail = (order) => {
  const orderNumber = getOrderNumber(order);
  const customer = getCustomer(order);
  const orderUrl = getOrderUrl(order);
  const createdAt = formatDate(order.createdAt);

  const html = emailLayout({
    title: `Order ${orderNumber} received`,
    preview: `We received your ${env.email.storeName} order ${orderNumber}.`,
    content: `
      <p style="margin:0 0 16px;">Hi ${escapeHtml(customer.name)},</p>
      <p style="margin:0 0 16px;">We received your order and will let you know when it moves to the next step.</p>
      <p style="margin:0 0 16px;"><strong>Order:</strong> ${escapeHtml(orderNumber)}${createdAt ? `<br /><strong>Placed:</strong> ${escapeHtml(createdAt)}` : ''}</p>
      ${orderItemsHtml(order)}
      <h2 style="margin:24px 0 8px;font-size:16px;">Shipping address</h2>
      <p style="margin:0;color:#374151;">${htmlAddress(order.shippingAddress)}</p>
      <p style="margin:24px 0 0;">
        <a href="${escapeHtml(orderUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 16px;">View order</a>
      </p>
    `
  });

  const text = [
    `Hi ${customer.name},`,
    `We received your ${env.email.storeName} order.`,
    `Order: ${orderNumber}`,
    createdAt ? `Placed: ${createdAt}` : '',
    orderItemsText(order),
    `Shipping address:\n${formatAddress(order.shippingAddress)}`,
    `View order: ${orderUrl}`
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    to: customer.email,
    subject: `Order ${orderNumber} received`,
    html,
    text
  };
};

const buildAdminOrderEmail = (order) => {
  const orderNumber = getOrderNumber(order);
  const customer = getCustomer(order);
  const adminUrl = getAdminOrdersUrl();
  const createdAt = formatDate(order.createdAt);
  const customerNote = order.customerNote ? String(order.customerNote).trim() : '';

  const html = emailLayout({
    title: `New order ${orderNumber}`,
    preview: `New ${env.email.storeName} order from ${customer.name}.`,
    content: `
      <p style="margin:0 0 16px;">A new order was placed on ${escapeHtml(env.email.storeName)}.</p>
      <p style="margin:0 0 16px;">
        <strong>Customer:</strong> ${escapeHtml(customer.name)}<br />
        <strong>Email:</strong> ${escapeHtml(customer.email || 'Unavailable')}<br />
        <strong>Phone:</strong> ${escapeHtml(customer.phone || 'Unavailable')}<br />
        <strong>Payment:</strong> ${escapeHtml(humanize(order.payment?.method || ''))} (${escapeHtml(humanize(order.payment?.status || 'pending'))})<br />
        <strong>Status:</strong> ${escapeHtml(humanize(order.status || 'pending'))}${createdAt ? `<br /><strong>Placed:</strong> ${escapeHtml(createdAt)}` : ''}
      </p>
      ${orderItemsHtml(order)}
      <h2 style="margin:24px 0 8px;font-size:16px;">Shipping address</h2>
      <p style="margin:0;color:#374151;">${htmlAddress(order.shippingAddress)}</p>
      ${
        customerNote
          ? `<h2 style="margin:24px 0 8px;font-size:16px;">Customer note</h2><p style="margin:0;color:#374151;">${escapeHtml(customerNote)}</p>`
          : ''
      }
      <p style="margin:24px 0 0;">
        <a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 16px;">Open admin orders</a>
      </p>
    `
  });

  const text = [
    `New order ${orderNumber}`,
    `Customer: ${customer.name}`,
    `Email: ${customer.email || 'Unavailable'}`,
    `Phone: ${customer.phone || 'Unavailable'}`,
    `Payment: ${humanize(order.payment?.method || '')} (${humanize(order.payment?.status || 'pending')})`,
    `Status: ${humanize(order.status || 'pending')}`,
    createdAt ? `Placed: ${createdAt}` : '',
    orderItemsText(order),
    `Shipping address:\n${formatAddress(order.shippingAddress)}`,
    customerNote ? `Customer note:\n${customerNote}` : '',
    `Admin orders: ${adminUrl}`
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    to: env.email.adminTo,
    subject: `New order ${orderNumber} - ${formatMoney(order.pricing?.total)}`,
    html,
    text,
    replyTo: customer.email || env.email.replyTo || undefined
  };
};

const buildCustomerStatusEmail = (order, options = {}) => {
  const orderNumber = getOrderNumber(order);
  const customer = getCustomer(order);
  const orderUrl = getOrderUrl(order);
  const status = humanize(order.status || 'updated');
  const note = options.note ? String(options.note).trim() : '';

  const html = emailLayout({
    title: `Order ${orderNumber} is ${status}`,
    preview: `Your ${env.email.storeName} order status changed to ${status}.`,
    content: `
      <p style="margin:0 0 16px;">Hi ${escapeHtml(customer.name)},</p>
      <p style="margin:0 0 16px;">Your order status is now <strong>${escapeHtml(status)}</strong>.</p>
      ${note ? `<p style="margin:0 0 16px;color:#374151;">${escapeHtml(note)}</p>` : ''}
      ${orderItemsHtml(order)}
      <p style="margin:24px 0 0;">
        <a href="${escapeHtml(orderUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 16px;">View order</a>
      </p>
    `
  });

  const text = [
    `Hi ${customer.name},`,
    `Your order ${orderNumber} is now ${status}.`,
    note,
    orderItemsText(order),
    `View order: ${orderUrl}`
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    to: customer.email,
    subject: `Order ${orderNumber} is ${status}`,
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
