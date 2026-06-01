const hasPopulatedUser = (user) => user && typeof user === 'object' && (user.name || user.email || user.phone);

export const presentOrder = (order) => {
  const plain = typeof order?.toObject === 'function' ? order.toObject({ virtuals: true }) : order;
  if (!plain) return plain;

  const orderId = plain._id?.toString?.() || plain.id || '';
  const account = hasPopulatedUser(plain.user) ? plain.user : {};
  const shipping = plain.shippingAddress || {};
  const snapshot = plain.customerSnapshot || {};
  const items = plain.items || [];
  const products = items.map((item) => item.name).filter(Boolean);
  const count = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const deliveryName = shipping.fullName || snapshot.name || account.name || 'Customer';
  const deliveryPhone = shipping.phone || snapshot.phone || account.phone || '';
  const accountName = account.name || '';
  const accountEmail = account.email || snapshot.email || '';
  const accountPhone = account.phone || '';
  const customerEmail = snapshot.email || account.email || '';
  const customerPhone = snapshot.phone || deliveryPhone;

  return {
    ...plain,
    id: orderId,
    customer: {
      name: snapshot.name || deliveryName,
      email: customerEmail,
      phone: customerPhone,
      accountName: accountName || snapshot.name || deliveryName,
      accountEmail,
      accountPhone,
      deliveryName,
      deliveryPhone,
      displayName: deliveryName,
      displayEmail: customerEmail
    },
    itemSummary: {
      count,
      productCount: items.length,
      products,
      label: products.length
        ? `${products.slice(0, 2).join(', ')}${products.length > 2 ? ` +${products.length - 2} more` : ''}`
        : 'No products'
    }
  };
};

export const presentOrders = (orders = []) => orders.map((order) => presentOrder(order));
