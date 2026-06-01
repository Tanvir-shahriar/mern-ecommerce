import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { Category } from '../../src/models/category.model.js';
import { Order } from '../../src/models/order.model.js';
import { Product } from '../../src/models/product.model.js';
import { User } from '../../src/models/user.model.js';
import { signToken } from '../../src/utils/tokens.js';

let mongo;

const address = {
  fullName: 'Customer One',
  phone: '01700000000',
  line1: 'House 12',
  city: 'Dhaka',
  state: 'Dhaka',
  postalCode: '1207',
  country: 'Bangladesh'
};

const createUser = (overrides = {}) =>
  User.create({
    name: overrides.name || 'Test User',
    email: overrides.email || `user-${Date.now()}@example.com`,
    password: 'Password123!',
    role: overrides.role || 'customer',
    phone: overrides.phone || '01800000000'
  });

const createProduct = async () => {
  const suffix = new mongoose.Types.ObjectId().toString();
  const category = await Category.create({ name: `Review Watches ${suffix}` });

  return Product.create({
    name: `Review Watch ${suffix}`,
    shortDescription: 'A reviewable delivery watch.',
    description: 'A reviewable delivery watch for integration tests.',
    category: category._id,
    brand: 'lahVenture',
    sku: `REV-${suffix.slice(-8)}`,
    price: 2500,
    images: [{ url: 'https://example.com/watch.jpg', alt: 'Review watch' }],
    inventory: { stock: 5, lowStockThreshold: 2, trackQuantity: true }
  });
};

const createOrder = (user, overrides = {}) =>
  Order.create({
    user: user._id,
    status: overrides.status || 'pending',
    deliveredAt: overrides.status === 'delivered' ? new Date() : undefined,
    items: [
      {
        product: overrides.productId || new mongoose.Types.ObjectId(),
        name: 'LahVenture Classic Watch',
        sku: 'LV-CLASSIC',
        price: 2500,
        quantity: 1
      }
    ],
    shippingAddress: address,
    billingAddress: address,
    customerSnapshot: {
      name: address.fullName,
      email: user.email,
      phone: address.phone
    },
    pricing: {
      subtotal: 2500,
      total: 2620
    }
  });

describe('order access', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterEach(async () => {
    await Promise.all([Order.deleteMany({}), Product.deleteMany({}), Category.deleteMany({}), User.deleteMany({})]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('lets a super admin view a customer order by id', async () => {
    const customer = await createUser({ email: 'customer@example.com' });
    const superAdmin = await createUser({ email: 'owner@example.com', role: 'super_admin' });
    const order = await createOrder(customer);

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${signToken(superAdmin._id)}`)
      .expect(200);

    expect(response.body.data.order._id).toBe(order._id.toString());
    expect(response.body.data.order.customer.email).toBe(customer.email);
  });

  it('lets the owner and admins view an order by order number', async () => {
    const customer = await createUser({ email: 'number-owner@example.com' });
    const superAdmin = await createUser({ email: 'number-admin@example.com', role: 'super_admin' });
    const order = await createOrder(customer);

    const ownerResponse = await request(app)
      .get(`/api/orders/${order.orderNumber}`)
      .set('Authorization', `Bearer ${signToken(customer._id)}`)
      .expect(200);

    const adminResponse = await request(app)
      .get(`/api/orders/${order.orderNumber.toLowerCase()}`)
      .set('Authorization', `Bearer ${signToken(superAdmin._id)}`)
      .expect(200);

    expect(ownerResponse.body.data.order._id).toBe(order._id.toString());
    expect(ownerResponse.body.data.order.id).toBe(order._id.toString());
    expect(adminResponse.body.data.order.orderNumber).toBe(order.orderNumber);
  });

  it('keeps customer order detail access scoped to their own orders', async () => {
    const owner = await createUser({ email: 'owner-customer@example.com' });
    const otherCustomer = await createUser({ email: 'other-customer@example.com' });
    const order = await createOrder(owner);

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${signToken(otherCustomer._id)}`)
      .expect(404);

    expect(response.body.message).toBe('Order not found');
  });

  it('keeps customer order-number access scoped to their own orders', async () => {
    const owner = await createUser({ email: 'owner-number@example.com' });
    const otherCustomer = await createUser({ email: 'other-number@example.com' });
    const order = await createOrder(owner);

    const response = await request(app)
      .get(`/api/orders/${order.orderNumber}`)
      .set('Authorization', `Bearer ${signToken(otherCustomer._id)}`)
      .expect(404);

    expect(response.body.message).toBe('Order not found');
  });

  it('lets a customer review a product from their delivered order', async () => {
    const customer = await createUser({ email: 'review-customer@example.com' });
    const product = await createProduct();
    const order = await createOrder(customer, { productId: product._id, status: 'delivered' });

    const response = await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${signToken(customer._id)}`)
      .send({
        orderId: order._id.toString(),
        rating: 5,
        comment: 'Arrived safely and wears very well.'
      })
      .expect(201);

    expect(response.body.data.product.ratingsCount).toBe(1);
    expect(response.body.data.product.reviews[0]).toMatchObject({
      name: customer.name,
      verifiedPurchase: true
    });
  });

  it('shows delivered-order reviews on the public product detail page', async () => {
    const customer = await createUser({ name: 'Public Reviewer', email: 'public-reviewer@example.com' });
    const product = await createProduct();
    const order = await createOrder(customer, { productId: product._id, status: 'delivered' });

    await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${signToken(customer._id)}`)
      .send({
        orderId: order._id.toString(),
        rating: 5,
        comment: 'This review should be visible to everyone.'
      })
      .expect(201);

    const response = await request(app).get(`/api/products/${product._id}`).expect(200);

    expect(response.headers['cache-control']).toContain('no-store');
    expect(response.body.data.product.ratingsCount).toBe(1);
    expect(response.body.data.product.reviews).toEqual([
      expect.objectContaining({
        name: 'Public Reviewer',
        rating: 5,
        comment: 'This review should be visible to everyone.',
        verifiedPurchase: true
      })
    ]);
    expect(response.body.data.product.reviews[0].user).toBeUndefined();
  });

  it('keeps legacy customer reviews visible when status is missing', async () => {
    const customer = await createUser({ name: 'Legacy Reviewer', email: 'legacy-reviewer@example.com' });
    const product = await createProduct();

    await Product.collection.updateOne(
      { _id: product._id },
      {
        $push: {
          reviews: {
            _id: new mongoose.Types.ObjectId(),
            user: customer._id,
            order: new mongoose.Types.ObjectId(),
            name: customer.name,
            rating: 4,
            comment: 'A legacy review without a status should still be public.',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      }
    );

    const response = await request(app).get(`/api/products/${product._id}`).expect(200);

    expect(response.body.data.product.ratingsCount).toBe(1);
    expect(response.body.data.product.reviews[0]).toMatchObject({
      name: 'Legacy Reviewer',
      rating: 4,
      comment: 'A legacy review without a status should still be public.'
    });
  });

  it('blocks product reviews until the order has been delivered', async () => {
    const customer = await createUser({ email: 'pending-review@example.com' });
    const product = await createProduct();
    const order = await createOrder(customer, { productId: product._id, status: 'processing' });

    const response = await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${signToken(customer._id)}`)
      .send({
        orderId: order._id.toString(),
        rating: 4,
        comment: 'Trying to review before delivery.'
      })
      .expect(403);

    expect(response.body.message).toBe('You can review this product after it has been delivered to you');
  });
});
