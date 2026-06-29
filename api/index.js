import { app } from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';

let connectionPromise;

const ensureDatabase = async () => {
  if (!connectionPromise) {
    connectionPromise = connectDB().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
};

export default async function handler(req, res) {
  try {
    await ensureDatabase();
  } catch (error) {
    console.error('Vercel DB Connection Error:', error);
  }
  return app(req, res);
}
