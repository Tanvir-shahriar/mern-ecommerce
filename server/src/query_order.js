import mongoose from 'mongoose';
import { Order } from './models/order.model.js';
import { User } from './models/user.model.js';
import { connectDB, disconnectDB } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

try {
  await connectDB();
  const order = await Order.findById('6a44ca092ed1c4d9760a35e1').populate('user');
  if (order) {
    console.log('Order found:');
    console.log(`Order Number: ${order.orderNumber}`);
    console.log(`User: ${order.user?.name} (${order.user?.email})`);
    console.log(`Customer Snapshot: ${order.customerSnapshot?.name} (${order.customerSnapshot?.email})`);
  } else {
    console.log('Order not found');
  }
} catch (err) {
  console.error('Error:', err);
} finally {
  await disconnectDB();
}
