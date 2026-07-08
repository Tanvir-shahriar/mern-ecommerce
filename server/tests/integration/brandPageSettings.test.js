import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { BrandPageSetting } from '../../src/models/brandPageSetting.model.js';
import { User } from '../../src/models/user.model.js';
import { clearBrandPageSettingsCache } from '../../src/services/brandPageSettings.service.js';
import { signToken } from '../../src/utils/tokens.js';

let mongo;

const createUser = (role = 'admin') =>
  User.create({
    name: `${role} user`,
    email: `${role}-brand-page@example.com`,
    password: 'Password123!',
    role
  });

const payload = {
  faqs: [
    {
      id: 'authenticity',
      question: 'Can I edit this FAQ question?',
      answer: 'Yes, admins can update brand page FAQ questions and answers from the admin panel.',
      isActive: true
    },
    {
      id: 'hidden-faq',
      question: 'Should hidden FAQs be public?',
      answer: 'No, inactive FAQs are stored for admins but omitted from the public brands page.',
      isActive: false
    }
  ]
};

describe('brand page settings', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }, 60_000);

  afterEach(async () => {
    await Promise.all([BrandPageSetting.deleteMany({}), User.deleteMany({})]);
    clearBrandPageSettingsCache();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo?.stop();
  });

  it('lets admins update brands page FAQs and exposes only active FAQs publicly', async () => {
    const defaultResponse = await request(app).get('/api/brand-page').expect(200);
    expect(defaultResponse.body.data.faqs).toHaveLength(2);

    const admin = await createUser('admin');
    const updateResponse = await request(app)
      .patch('/api/admin/brand-page')
      .set('Authorization', `Bearer ${signToken(admin._id)}`)
      .send(payload)
      .expect(200);

    expect(updateResponse.body.message).toBe('Brand FAQ section saved');
    expect(updateResponse.body.data.faqs).toHaveLength(2);
    expect(updateResponse.body.data.faqs[0]).toMatchObject({
      id: 'authenticity',
      question: 'Can I edit this FAQ question?',
      order: 0,
      isActive: true
    });

    const adminResponse = await request(app)
      .get('/api/admin/brand-page')
      .set('Authorization', `Bearer ${signToken(admin._id)}`)
      .expect(200);

    expect(adminResponse.body.data.faqs).toHaveLength(2);

    const publicResponse = await request(app).get('/api/brand-page').expect(200);
    expect(publicResponse.body.data.faqs).toHaveLength(1);
    expect(publicResponse.body.data.faqs[0]).toMatchObject({
      id: 'authenticity',
      answer: 'Yes, admins can update brand page FAQ questions and answers from the admin panel.'
    });
  });

  it('blocks non-admin users from updating brand page FAQs', async () => {
    const customer = await createUser('customer');

    await request(app)
      .patch('/api/admin/brand-page')
      .set('Authorization', `Bearer ${signToken(customer._id)}`)
      .send(payload)
      .expect(403);
  });
});
