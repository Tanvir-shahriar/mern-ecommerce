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
    description: 'A detailed product description for grouped catalog section tests.',
    category: category._id,
    brand: 'LahVenture',
    sku: overrides.sku || `SECTION-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    price: overrides.price || 1000,
    images: [{ url: '/uploads/products/test.png', alt: 'Test product' }],
    status: overrides.status || 'active',
    inventory: { stock: 4, lowStockThreshold: 1, trackQuantity: true },
    ...overrides
  });

describe('product sections', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }, 60_000);

  afterEach(async () => {
    await Promise.all([Product.deleteMany({}), Category.deleteMany({}), User.deleteMany({})]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo?.stop();
  });

  it('returns active product categories in admin-controlled order and hides empty categories', async () => {
    const admin = await User.create({
      name: 'Section Admin',
      email: 'section-admin@example.com',
      password: 'Password123!',
      role: 'admin'
    });
    const emptyCategory = await Category.create({ name: 'Empty Cases', order: 0 });
    const mechanical = await Category.create({ name: 'Mechanical Watches', order: 1 });
    const straps = await Category.create({ name: 'Watch Straps', order: 2 });

    await makeProduct(straps, { name: 'Leather Strap', sku: 'SECTION-STRAP' });
    await makeProduct(mechanical, { name: 'Automatic Watch', sku: 'SECTION-WATCH' });
    await makeProduct(emptyCategory, { name: 'Draft Case', sku: 'SECTION-DRAFT', status: 'draft' });

    const initialResponse = await request(app).get('/api/products/sections').expect(200);

    expect(initialResponse.body.data.sections.map((section) => section.category.name)).toEqual([
      'Mechanical Watches',
      'Watch Straps'
    ]);
    expect(initialResponse.body.data.totalProducts).toBe(2);

    const token = signToken(admin._id);
    await request(app)
      .patch(`/api/categories/${straps._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ order: 0 })
      .expect(200);
    await request(app)
      .patch(`/api/categories/${mechanical._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ order: 3 })
      .expect(200);

    const reorderedResponse = await request(app).get('/api/products/sections').expect(200);

    expect(reorderedResponse.body.data.sections.map((section) => section.category.name)).toEqual([
      'Watch Straps',
      'Mechanical Watches'
    ]);
  });
});
