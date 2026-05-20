# Northstar Commerce

A full MERN stack e-commerce application with a MongoDB-backed API, responsive React storefront, account area, cart, checkout, orders, wishlist, reviews, coupon support, inventory management, and admin dashboards.

## Stack

- MongoDB + Mongoose
- Express 5 API with JWT auth, httpOnly cookies, validation, rate limiting, and upload handling
- React + Vite + React Router + TanStack Query
- Socket.IO hooks for order events

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create environment files:

   ```bash
   cp .env.example .env
   cp client/.env.example client/.env
   cp server/.env.example server/.env
   ```

3. Start MongoDB:

   ```bash
   docker compose up -d mongo
   ```

4. Seed demo data:

   ```bash
   npm run seed
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

The storefront runs on `http://localhost:5173` and the API runs on `http://localhost:5001`.

Demo admin: `admin@example.com` / `Admin123!`

Demo customer: `customer@example.com` / `Customer123!`

## MongoDB Atlas

The app reads MongoDB from `MONGO_URI` in `.env` or `server/.env`. For Atlas, use a URI with a database name in the path, for example:

```env
MONGO_URI="mongodb+srv://<user>:<password>@<cluster-host>/mern_ecommerce?retryWrites=true&w=majority&appName=<app-name>"
```

Before running the server, add your current machine IP in Atlas under **Security > Network Access**. Then run:

```bash
npm run seed
npm run dev
```

## Main Features

- Customer authentication, profile updates, wishlist, cart, coupon application, checkout, and order history
- Product catalog with search, category filtering, price filtering, sorting, stock status, product details, and reviews
- Admin dashboard with revenue, order, user, product, recent order, and low-stock metrics
- Admin product/category creation, product archiving, and order status updates
- Local image upload endpoints and static upload serving
- MongoDB seed data for categories, products, coupons, and demo users

## Useful Scripts

```bash
npm run dev          # client + server
npm run dev:server   # Express API only
npm run dev:client   # Vite client only
npm run seed         # reset and seed MongoDB
npm run build        # build React client
npm test             # backend smoke tests
```

## Vercel Deployment

This repo includes `vercel.json` and `api/index.js` so Vercel can deploy the React app and route `/api/*` requests to the Express API.

Set these Vercel environment variables before deploying:

```bash
MONGO_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<long random production secret>
JWT_EXPIRES_IN=7d
COOKIE_EXPIRES_DAYS=7
UPLOAD_DIR=uploads
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=<secure admin password>
```

After the first deployment, set `CLIENT_URL` to the deployed Vercel URL, for example:

```bash
CLIENT_URL=https://your-project.vercel.app
```

Uploads use local filesystem storage in development. On Vercel, uploaded images are returned as data URLs so product creation works without a writable filesystem. For a real production store, use Cloudinary or S3 instead.
