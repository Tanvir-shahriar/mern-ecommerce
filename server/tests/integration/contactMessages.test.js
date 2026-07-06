import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { ContactMessage } from '../../src/models/contactMessage.model.js';
import { User } from '../../src/models/user.model.js';
import { signToken } from '../../src/utils/tokens.js';

let mongo;

const contactPayload = {
  name: 'Contact Customer',
  email: 'Customer@Example.com',
  phone: '+8801853379787',
  message: 'I need help choosing a LahVenture watch.'
};

const createAdmin = () =>
  User.create({
    name: 'Contact Admin',
    email: 'contact-admin@example.com',
    password: 'Password123!',
    role: 'admin'
  });

describe('contact messages', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }, 60_000);

  afterEach(async () => {
    await Promise.all([ContactMessage.deleteMany({}), User.deleteMany({})]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo?.stop();
  });

  it('stores contact page submissions for admins', async () => {
    const response = await request(app)
      .post('/api/contact')
      .send(contactPayload)
      .expect(201);

    expect(response.body.message).toBe('Your message has been sent.');

    const stored = await ContactMessage.findOne({ email: 'customer@example.com' }).lean();
    expect(stored).toMatchObject({
      name: contactPayload.name,
      email: 'customer@example.com',
      phone: contactPayload.phone,
      message: contactPayload.message,
      status: 'new',
      source: 'contact_page'
    });
  });

  it('lets admins list and update contact message status', async () => {
    const admin = await createAdmin();
    const contactMessage = await ContactMessage.create(contactPayload);

    const listResponse = await request(app)
      .get('/api/admin/contact-messages')
      .set('Authorization', `Bearer ${signToken(admin._id)}`)
      .expect(200);

    expect(listResponse.body.data.messages).toHaveLength(1);
    expect(listResponse.body.data.metrics.newCount).toBe(1);
    expect(listResponse.body.data.messages[0]).toMatchObject({
      name: contactPayload.name,
      email: contactPayload.email.toLowerCase(),
      status: 'new'
    });

    const updateResponse = await request(app)
      .patch(`/api/admin/contact-messages/${contactMessage._id}`)
      .set('Authorization', `Bearer ${signToken(admin._id)}`)
      .send({ status: 'read' })
      .expect(200);

    expect(updateResponse.body.data.contactMessage.status).toBe('read');
    expect(updateResponse.body.data.contactMessage.readAt).toBeTruthy();
  });

  it('blocks non-admins from reading contact messages', async () => {
    const customer = await User.create({
      name: 'Regular Customer',
      email: 'regular-contact@example.com',
      password: 'Password123!'
    });

    await request(app)
      .get('/api/admin/contact-messages')
      .set('Authorization', `Bearer ${signToken(customer._id)}`)
      .expect(403);
  });
});
