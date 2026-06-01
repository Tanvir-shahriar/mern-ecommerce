export const orderIdentifier = (order) => order?._id || order?.id || order?.orderNumber || '';

export const orderDetailPath = (order) => `/orders/${orderIdentifier(order)}`;

export const orderCustomerName = (order) =>
  order?.customer?.deliveryName ||
  order?.shippingAddress?.fullName ||
  order?.customer?.displayName ||
  order?.customer?.name ||
  order?.customer?.accountName ||
  'Customer';

export const orderCustomerEmail = (order) =>
  order?.customer?.displayEmail || order?.customer?.email || order?.customer?.accountEmail || order?.user?.email || '';

export const orderCustomerPhone = (order) =>
  order?.customer?.deliveryPhone || order?.shippingAddress?.phone || order?.customer?.phone || order?.customer?.accountPhone || '';
