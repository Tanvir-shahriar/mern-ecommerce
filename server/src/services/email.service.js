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
              <td style="padding:24px;background:linear-gradient(90deg, #6b000b 0%, #4a0006 100%);color:#ffffff;">
                <img src="${escapeHtml(getLogoUrl())}" width="72" height="72" alt="${escapeHtml(env.email.storeName)}" style="display:block;width:72px;height:72px;object-fit:contain;margin:0 0 14px;border-radius:4px;" />
                <div style="font-size:13px;letter-spacing:0.5px;text-transform:uppercase;color:rgba(255,255,255,0.7);font-weight:bold;">${escapeHtml(env.email.storeName)}</div>
                <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;font-weight:bold;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;font-size:15px;line-height:1.6;">
                ${content}
                <p style="margin:28px 0 0;color:#4b5563;">Thanks,<br /><strong>${escapeHtml(env.email.storeName)}</strong></p>
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
  const status = order.status || 'pending';
  const note = options.note ? String(options.note).trim() : '';

  // Get active step index based on status mapping
  let activeIndex = 0; // 0: Processed, 1: Shipped, 2: En Route, 3: Arrived
  let statusTitle = '';
  let statusDescription = '';
  let previewText = '';

  if (status === 'delivered') {
    activeIndex = 3;
    statusTitle = `Order Delivered!`;
    statusDescription = `Great news! Your order has arrived at your address. We hope you love your new timepiece.`;
    previewText = `Your order ${orderNumber} has been delivered.`;
  } else if (status === 'shipped') {
    activeIndex = 2;
    statusTitle = `Order En Route!`;
    statusDescription = `Your order is en route! It has been dispatched and is on its way to your delivery address.`;
    previewText = `Your order ${orderNumber} is en route.`;
  } else if (status === 'processing') {
    activeIndex = 1;
    statusTitle = `Order Packed & Shipped`;
    statusDescription = `Your order has been packed and handed over to our shipping partner. It's getting closer!`;
    previewText = `Your order ${orderNumber} is packed and ready.`;
  } else if (status === 'cancelled') {
    activeIndex = -1;
    statusTitle = `Order Cancelled`;
    statusDescription = `We are sorry to inform you that your order has been cancelled. Please contact customer support for details.`;
    previewText = `Your order ${orderNumber} has been cancelled.`;
  } else if (status === 'refunded') {
    activeIndex = -1;
    statusTitle = `Order Refunded`;
    statusDescription = `Your order has been refunded. The refund amount will appear in your account soon.`;
    previewText = `Your order ${orderNumber} has been refunded.`;
  } else {
    // pending, confirmed
    activeIndex = 0;
    statusTitle = `Order Processed`;
    statusDescription = `Your order has been processed. We are preparing the item for packaging.`;
    previewText = `Your order ${orderNumber} has been processed.`;
  }

  // Formatting Expected Arrival Date
  const expectedDateStr = order.expectedDeliveryDate
    ? new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(order.expectedDeliveryDate))
    : new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  // Build reddish-themed progress bar (HTML Table) matching the image
  let progressBarHtml = '';
  if (activeIndex >= 0) {
    const activeColor = '#6b000b'; // Reddish brand color
    const inactiveColor = '#cbd5e1';
    const lineActiveColor = '#6b000b';
    const lineInactiveColor = '#e2e8f0';

    const node1Color = activeIndex >= 0 ? activeColor : inactiveColor;
    const node2Color = activeIndex >= 1 ? activeColor : inactiveColor;
    const node3Color = activeIndex >= 2 ? activeColor : inactiveColor;
    const node4Color = activeIndex >= 3 ? activeColor : inactiveColor;

    const node1Border = activeIndex >= 0 ? 'none' : `2px solid ${inactiveColor}`;
    const node2Border = activeIndex >= 1 ? 'none' : `2px solid ${inactiveColor}`;
    const node3Border = activeIndex >= 2 ? 'none' : `2px solid ${inactiveColor}`;
    const node4Border = activeIndex >= 3 ? 'none' : `2px solid ${inactiveColor}`;

    const line1Color = activeIndex >= 1 ? lineActiveColor : lineInactiveColor;
    const line2Color = activeIndex >= 2 ? lineActiveColor : lineInactiveColor;
    const line3Color = activeIndex >= 3 ? lineActiveColor : lineInactiveColor;

    const checkIcon = '✓';
    const emptyIcon = '&nbsp;';

    const node1Text = activeIndex >= 0 ? checkIcon : emptyIcon;
    const node2Text = activeIndex >= 1 ? checkIcon : emptyIcon;
    const node3Text = activeIndex >= 2 ? checkIcon : emptyIcon;
    const node4Text = activeIndex >= 3 ? checkIcon : emptyIcon;

    const label1Color = activeIndex >= 0 ? '#6b000b' : '#6b7280';
    const label2Color = activeIndex >= 1 ? '#6b000b' : '#6b7280';
    const label3Color = activeIndex >= 2 ? '#6b000b' : '#6b7280';
    const label4Color = activeIndex >= 3 ? '#6b000b' : '#6b7280';

    progressBarHtml = `
      <div style="background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:20px; margin:24px 0; font-family:Arial, sans-serif; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <!-- Order header inside progress bar -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin-bottom:16px;">
          <tr>
            <td align="left" style="font-size:14px; font-weight:bold; color:#111827;">
              ORDER #${escapeHtml(orderNumber)}
            </td>
            <td align="right" style="font-size:13px; color:#4b5563; text-align:right; font-weight:600;">
              Expected Arrival: <span style="color:#6b000b;">${escapeHtml(expectedDateStr)}</span>
            </td>
          </tr>
        </table>

        <!-- Nodes and connector lines -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin-bottom:12px; table-layout:fixed;">
          <tr>
            <!-- Node 1 -->
            <td align="center" width="24" style="padding:0; vertical-align:middle;">
              <div style="width:24px; height:24px; line-height:24px; border-radius:12px; background-color:${node1Color}; color:#ffffff; font-size:12px; font-weight:bold; text-align:center; border:${node1Border};">
                ${node1Text}
              </div>
            </td>
            <!-- Line 1-2 -->
            <td style="padding:0; vertical-align:middle;">
              <div style="height:4px; background-color:${line1Color}; font-size:1px; line-height:1px;">&nbsp;</div>
            </td>
            <!-- Node 2 -->
            <td align="center" width="24" style="padding:0; vertical-align:middle;">
              <div style="width:24px; height:24px; line-height:24px; border-radius:12px; background-color:${node2Color}; color:#ffffff; font-size:12px; font-weight:bold; text-align:center; border:${node2Border};">
                ${node2Text}
              </div>
            </td>
            <!-- Line 2-3 -->
            <td style="padding:0; vertical-align:middle;">
              <div style="height:4px; background-color:${line2Color}; font-size:1px; line-height:1px;">&nbsp;</div>
            </td>
            <!-- Node 3 -->
            <td align="center" width="24" style="padding:0; vertical-align:middle;">
              <div style="width:24px; height:24px; line-height:24px; border-radius:12px; background-color:${node3Color}; color:#ffffff; font-size:12px; font-weight:bold; text-align:center; border:${node3Border};">
                ${node3Text}
              </div>
            </td>
            <!-- Line 3-4 -->
            <td style="padding:0; vertical-align:middle;">
              <div style="height:4px; background-color:${line3Color}; font-size:1px; line-height:1px;">&nbsp;</div>
            </td>
            <!-- Node 4 -->
            <td align="center" width="24" style="padding:0; vertical-align:middle;">
              <div style="width:24px; height:24px; line-height:24px; border-radius:12px; background-color:${node4Color}; color:#ffffff; font-size:12px; font-weight:bold; text-align:center; border:${node4Border};">
                ${node4Text}
              </div>
            </td>
          </tr>
        </table>

        <!-- Node Labels & Emojis -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; table-layout:fixed;">
          <tr>
            <td align="center" style="font-size:10px; font-weight:700; color:${label1Color}; padding-top:4px; vertical-align:top; line-height:1.2; text-transform:uppercase;">
              <span style="font-size:16px;">📋</span><br/>Processed
            </td>
            <td align="center" style="font-size:10px; font-weight:700; color:${label2Color}; padding-top:4px; vertical-align:top; line-height:1.2; text-transform:uppercase;">
              <span style="font-size:16px;">📦</span><br/>Shipped
            </td>
            <td align="center" style="font-size:10px; font-weight:700; color:${label3Color}; padding-top:4px; vertical-align:top; line-height:1.2; text-transform:uppercase;">
              <span style="font-size:16px;">🚚</span><br/>En Route
            </td>
            <td align="center" style="font-size:10px; font-weight:700; color:${label4Color}; padding-top:4px; vertical-align:top; line-height:1.2; text-transform:uppercase;">
              <span style="font-size:16px;">🏠</span><br/>Arrived
            </td>
          </tr>
        </table>
      </div>
    `;
  } else {
    // cancelled or refunded
    progressBarHtml = `
      <div style="background-color:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:16px; margin:24px 0; font-family:Arial, sans-serif; text-align:center;">
        <span style="font-size:24px;">⚠️</span>
        <h3 style="margin:8px 0 4px; color:#991b1b;">${statusTitle}</h3>
        <p style="margin:0; font-size:14px; color:#4b5563;">${statusDescription}</p>
      </div>
    `;
  }

  const html = emailLayout({
    title: statusTitle,
    preview: previewText,
    content: `
      <p style="margin:0 0 16px;">Hi ${escapeHtml(customer.name)},</p>
      <p style="margin:0 0 16px;">${statusDescription}</p>
      
      ${progressBarHtml}

      ${note ? `<p style="margin:16px 0; padding:12px; background:#f9fafb; border-left:4px solid #6b000b; color:#374151; font-style:italic;">"${escapeHtml(note)}"</p>` : ''}
      
      <div style="margin:24px 0; border-top:1px solid #e5e7eb; padding-top:16px; border-bottom:1px solid #e5e7eb; padding-bottom:16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <tr>
            <td style="vertical-align:top; padding-right:16px;" width="50%">
              <h3 style="margin:0 0 8px; font-size:13px; text-transform:uppercase; color:#6b7280; letter-spacing:0.5px;">Delivery Address</h3>
              <p style="margin:0; font-size:14px; color:#374151; line-height:1.4;">${htmlAddress(order.shippingAddress)}</p>
            </td>
            <td style="vertical-align:top;" width="50%">
              <h3 style="margin:0 0 8px; font-size:13px; text-transform:uppercase; color:#6b7280; letter-spacing:0.5px;">Expected Arrival</h3>
              <p style="margin:0; font-size:14px; color:#374151; font-weight:bold;">${escapeHtml(expectedDateStr)}</p>
              <p style="margin:4px 0 0; font-size:12px; color:#6b7280;">Standard delivery takes up to 7 days.</p>
            </td>
          </tr>
        </table>
      </div>

      ${orderItemsHtml(order)}

      <p style="margin:24px 0 0;">
        <a href="${escapeHtml(orderUrl)}" style="display:inline-block; background:#6b000b; color:#ffffff; text-decoration:none; padding:12px 20px; font-weight:bold; border-radius:4px; font-size:14px; text-transform:uppercase; letter-spacing:0.5px;">Track Order Details</a>
      </p>
    `
  });

  const text = [
    `Hi ${customer.name},`,
    `${statusDescription}`,
    `Order Status: ${statusTitle}`,
    `Expected Arrival: ${expectedDateStr}`,
    `Delivery Address:\n${formatAddress(order.shippingAddress)}`,
    note ? `Note from shop: "${note}"` : '',
    orderItemsText(order),
    `Track Order Details: ${orderUrl}`
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    to: customer.email,
    subject: `[Update] Your order #${orderNumber} is ${status.toUpperCase()}`,
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
