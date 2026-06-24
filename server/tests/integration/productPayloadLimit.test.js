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

describe('admin product payload limits', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterEach(async () => {
    await Promise.all([Product.deleteMany({}), Category.deleteMany({}), User.deleteMany({})]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('accepts uploaded image data in product creation payloads above the old 1mb limit', async () => {
    const admin = await User.create({
      name: 'Inventory Admin',
      email: 'inventory-admin@example.com',
      password: 'Password123!',
      role: 'admin'
    });
    const category = await Category.create({ name: 'Payload Watches' });
    const imageData = `data:image/png;base64,${'a'.repeat(1_200_000)}`;

    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${signToken(admin._id)}`)
      .send({
        name: 'Large Payload Watch',
        description: 'A product with uploaded image data above the previous body parser limit.',
        shortDescription: 'Large payload test watch.',
        category: category._id.toString(),
        brand: 'lahVenture',
        sku: 'PAYLOAD-LARGE',
        price: 12000,
        images: [{ url: imageData, alt: 'Large payload watch', publicId: 'large-payload-watch' }],
        inventory: { stock: 5, lowStockThreshold: 2, trackQuantity: true },
        status: 'active'
      })
      .expect(201);

    expect(response.body.data.product.name).toBe('Large Payload Watch');
    expect(response.body.data.product.images[0].url.length).toBeGreaterThan(1_000_000);
  });
});
