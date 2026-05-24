const hasPopulatedUser = (user) => user && typeof user === 'object' && (user.name || user.email || user.phone);

export const presentOrder = (order) => {
  const plain = typeof order?.toObject === 'function' ? order.toObject({ virtuals: true }) : order;
  if (!plain) return plain;

  const account = hasPopulatedUser(plain.user) ? plain.user : {};
  const shipping = plain.shippingAddress || {};
  const snapshot = plain.customerSnapshot || {};
  const items = plain.items || [];
  const products = items.map((item) => item.name).filter(Boolean);
  const count = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return {
    ...plain,
    customer: {
      name: snapshot.name || shipping.fullName || account.name || 'Customer',
      email: snapshot.email || account.email || '',
      phone: snapshot.phone || shipping.phone || account.phone || '',
      accountName: account.name || snapshot.name || '',
      accountEmail: account.email || snapshot.email || '',
      deliveryName: shipping.fullName || snapshot.name || '',
      deliveryPhone: shipping.phone || snapshot.phone || ''
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
