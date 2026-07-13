import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { Category } from '../../src/models/category.model.js';
import { Product } from '../../src/models/product.model.js';
import { User } from '../../src/models/user.model.js';
import { signToken } from '../../src/utils/tokens.js';

let mongo;

const makeProduct = (category, overrides = {}) =>
  Product.create({
    name: overrides.name || `Catalog Product ${Math.random().toString(36).slice(2)}`,
    description: 'A detailed product description for hot deals integration tests.',
    category: category._id,
    brand: 'LahVenture',
    sku: overrides.sku || `DEAL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    price: overrides.price || 1000,
    images: [{ url: '/uploads/products/test.png', alt: 'Test product' }],
    status: overrides.status || 'active',
    inventory: { stock: 4, lowStockThreshold: 1, trackQuantity: true },
    ...overrides
  });

describe('hot deals', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }, 300_000);

  afterEach(async () => {
    await Promise.all([Product.deleteMany({}), Category.deleteMany({}), User.deleteMany({})]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo?.stop();
  });

  it('retrieves only active products marked as isHotDeal', async () => {
    const mechanical = await Category.create({ name: 'Mechanical Watches', order: 1 });

    await makeProduct(mechanical, { name: 'Normal Watch', isHotDeal: false });
    await makeProduct(mechanical, { name: 'Hot Deal Watch', isHotDeal: true });
    await makeProduct(mechanical, { name: 'Draft Hot Deal', isHotDeal: true, status: 'draft' });

    const response = await request(app).get('/api/products/hot-deals').expect(200);

    expect(response.body.data.products.length).toBe(1);
    expect(response.body.data.products[0].name).toBe('Hot Deal Watch');
  });

  it('allows admins to update a product with isHotDeal flag', async () => {
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123!',
      role: 'admin'
    });
    const mechanical = await Category.create({ name: 'Mechanical Watches', order: 1 });
    const p = await makeProduct(mechanical, { name: 'Promo Watch', isHotDeal: false });

    const token = signToken(admin._id);

    const updateResponse = await request(app)
      .patch(`/api/products/${p._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isHotDeal: true })
      .expect(200);

    expect(updateResponse.body.data.product.isHotDeal).toBe(true);

    const updatedProduct = await Product.findById(p._id);
    expect(updatedProduct.isHotDeal).toBe(true);
  });
});
