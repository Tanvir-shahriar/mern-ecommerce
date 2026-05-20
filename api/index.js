import mongoose from 'mongoose';
import { app } from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';

let connectionPromise;

const ensureDatabase = async () => {
  if (mongoose.connection.readyState === 1) return;

  if (!connectionPromise) {
    connectionPromise = connectDB().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
};

export default async function handler(req, res) {
  await ensureDatabase();
  return app(req, res);
}
