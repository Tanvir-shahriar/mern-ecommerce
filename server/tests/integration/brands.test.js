import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { Brand } from '../../src/models/brand.model.js';
import { Category } from '../../src/models/category.model.js';
import { Product } from '../../src/models/product.model.js';
import { User } from '../../src/models/user.model.js';
import { signToken } from '../../src/utils/tokens.js';

let mongo;

const createAdmin = () =>
  User.create({
    name: 'Brand Admin',
    email: 'brand-admin@example.com',
    password: 'Password123!',
    role: 'admin'
  });

const productPayload = (categoryId, brandId) => ({
  name: 'Patek Reference 001',
  description: 'A detailed watch description for a brand-linked product.',
  category: categoryId.toString(),
  brandRef: brandId.toString(),
  sku: 'PTK-001',
  price: 1200,
  images: [{ url: '/uploads/products/patek.png', alt: 'Patek watch' }],
  inventory: {
    stock: 3,
    lowStockThreshold: 1,
    trackQuantity: true
  }
});

describe('brands', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }, 60_000);

  afterEach(async () => {
    await Promise.all([
      Brand.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      User.deleteMany({})
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo?.stop();
  });

  it('lets admins manage brands and assign products to them', async () => {
    const admin = await createAdmin();
    const token = signToken(admin._id);
    const category = await Category.create({ name: 'Mechanical Watches' });

    const brandResponse = await request(app)
      .post('/api/brands')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Patek Philippe',
        tagline: 'Haute Horlogerie',
        filterGroup: 'Swiss Heritage',
        description: 'Master of mechanical complexity.',
        image: { url: '/uploads/brands/patek.png', alt: 'Patek Philippe' },
        isActive: true,
        isSpotlight: true
      })
      .expect(201);

    const brand = brandResponse.body.data.brand;
    expect(brand.slug).toBe('patek-philippe');

    const productResponse = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productPayload(category._id, brand._id))
      .expect(201);

    expect(productResponse.body.data.product).toMatchObject({
      brand: 'Patek Philippe'
    });

    const filteredProducts = await request(app)
      .get('/api/products')
      .query({ brand: 'patek-philippe' })
      .expect(200);

    expect(filteredProducts.body.data.products).toHaveLength(1);
    expect(filteredProducts.body.data.products[0].brandRef).toMatchObject({
      name: 'Patek Philippe',
      slug: 'patek-philippe'
    });

    const publicBrands = await request(app).get('/api/brands').expect(200);
    expect(publicBrands.body.data.brands[0]).toMatchObject({
      name: 'Patek Philippe',
      productCount: 1
    });

    await request(app)
      .delete(`/api/brands/${brand._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(409);
  });

  it('blocks non-admin brand writes', async () => {
    const customer = await User.create({
      name: 'Brand Customer',
      email: 'brand-customer@example.com',
      password: 'Password123!'
    });

    await request(app)
      .post('/api/brands')
      .set('Authorization', `Bearer ${signToken(customer._id)}`)
      .send({ name: 'Unauthorized Brand' })
      .expect(403);
  });
});
