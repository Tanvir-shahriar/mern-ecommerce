import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return mongoose.connection;
  }

  mongoose.set('strictQuery', true);

  const connection = await mongoose.connect(env.mongoUri, {
    autoIndex: !env.isProduction
  });

  console.log(`MongoDB connected: ${connection.connection.host}`);
  return connection;
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
};
