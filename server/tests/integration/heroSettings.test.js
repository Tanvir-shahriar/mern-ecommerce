import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { HeroSetting } from '../../src/models/heroSetting.model.js';
import { User } from '../../src/models/user.model.js';
import { clearHeroSettingsCache } from '../../src/services/heroSettings.service.js';
import { signToken } from '../../src/utils/tokens.js';

let mongo;

const createUser = (role = 'admin') =>
  User.create({
    name: `${role} user`,
    email: `${role}-hero@example.com`,
    password: 'Password123!',
    role
  });

const payload = {
  slides: [
    {
      id: 'featured-watch',
      badge: 'Limited',
      sku: 'LV-01',
      title: ['Featured', 'Watch'],
      slogan: 'Time in focus',
      subtext: 'A configurable hero card for the storefront.',
      ctaText: 'Shop',
      ctaUrl: '/products',
      image: {
        url: '/uploads/hero/watch.png',
        alt: 'Featured watch'
      },
      video: {
        url: '/uploads/hero/watch.mp4',
        thumbnail: '/uploads/hero/watch-thumb.png',
        title: 'Featured watch video'
      },
      accentColor: '#7a0b17',
      accentColorRgb: '122, 11, 23',
      gradient: 'linear-gradient(90deg, #111, #333)',
      isActive: true
    },
    {
      id: 'hidden-watch',
      title: ['Hidden'],
      image: {
        url: '/uploads/hero/hidden.png'
      },
      isActive: false
    }
  ]
};

describe('hero settings', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }, 60_000);

  afterEach(async () => {
    await Promise.all([HeroSetting.deleteMany({}), User.deleteMany({})]);
    clearHeroSettingsCache();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo?.stop();
  });

  it('lets admins update hero slides and exposes only active slides publicly', async () => {
    const admin = await createUser('admin');

    const updateResponse = await request(app)
      .patch('/api/admin/hero')
      .set('Authorization', `Bearer ${signToken(admin._id)}`)
      .send(payload)
      .expect(200);

    expect(updateResponse.body.message).toBe('Hero section saved');
    expect(updateResponse.body.data.slides).toHaveLength(2);
    expect(updateResponse.body.data.slides[0]).toMatchObject({
      id: 'featured-watch',
      title: ['Featured', 'Watch'],
      image: {
        url: '/uploads/hero/watch.png'
      },
      video: {
        url: '/uploads/hero/watch.mp4',
        thumbnail: '/uploads/hero/watch-thumb.png'
      },
      order: 0,
      isActive: true
    });

    const publicResponse = await request(app).get('/api/hero').expect(200);

    expect(publicResponse.body.data.slides).toHaveLength(1);
    expect(publicResponse.body.data.slides[0].id).toBe('featured-watch');
  });

  it('blocks non-admin users from updating hero settings', async () => {
    const customer = await createUser('customer');

    await request(app)
      .patch('/api/admin/hero')
      .set('Authorization', `Bearer ${signToken(customer._id)}`)
      .send(payload)
      .expect(403);
  });
});
