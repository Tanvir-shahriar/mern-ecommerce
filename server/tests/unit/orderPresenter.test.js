import { describe, expect, it } from 'vitest';
import { presentOrder } from '../../src/utils/orderPresenter.js';

describe('presentOrder', () => {
  it('keeps order customer data consistent with the order snapshot', () => {
    const order = presentOrder({
      user: {
        name: 'Updated Account Name',
        email: 'updated@example.com',
        phone: '01700000000'
      },
      customerSnapshot: {
        name: 'Checkout Recipient',
        email: 'checkout@example.com',
        phone: '01800000000'
      },
      shippingAddress: {
        fullName: 'Checkout Recipient',
        phone: '01800000000'
      },
      items: [
        { name: 'Classic Watch', quantity: 2 },
        { name: 'Smart Watch', quantity: 1 }
      ]
    });

    expect(order.customer).toMatchObject({
      name: 'Checkout Recipient',
      email: 'checkout@example.com',
      phone: '01800000000',
      accountName: 'Updated Account Name',
      accountEmail: 'updated@example.com',
      accountPhone: '01700000000',
      deliveryName: 'Checkout Recipient',
      deliveryPhone: '01800000000',
      displayName: 'Checkout Recipient',
      displayEmail: 'checkout@example.com'
    });
    expect(order.itemSummary).toMatchObject({
      count: 3,
      productCount: 2,
      label: 'Classic Watch, Smart Watch'
    });
  });

  it('falls back to shipping and account data for older orders without a snapshot', () => {
    const order = presentOrder({
      user: {
        name: 'Account Name',
        email: 'account@example.com'
      },
      shippingAddress: {
        fullName: 'Delivery Person',
        phone: '01900000000'
      },
      items: [{ name: 'Field Watch', quantity: 1 }]
    });

    expect(order.customer).toMatchObject({
      name: 'Delivery Person',
      email: 'account@example.com',
      phone: '01900000000',
      accountName: 'Account Name',
      deliveryName: 'Delivery Person',
      deliveryPhone: '01900000000'
    });
    expect(order.itemSummary.label).toBe('Field Watch');
  });
});
