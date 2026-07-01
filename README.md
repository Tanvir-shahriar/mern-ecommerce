# lahVenture

A full MERN stack watch and smartwatch e-commerce application with a MongoDB-backed API by default, optional Hostinger/MySQL storage, responsive React storefront, account area, cart, checkout, orders, wishlist, reviews, coupon support, inventory management, and admin dashboards.

## Stack

- MongoDB + Mongoose by default, or Hostinger/MySQL via `DATABASE_PROVIDER=mysql`
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

## Email Notifications with Resend

The backend sends customer order confirmations, admin new-order notifications, and customer order status updates through Resend. Email delivery is skipped safely until the Resend environment variables are configured.

1. In Resend, verify the domain you want to send from and create an API key.
2. Add these values to `.env`, `server/.env`, or your deployment environment:

   ```env
   RESEND_API_KEY=re_xxxxxxxxx
   EMAIL_FROM=lahVenture <orders@your-domain.com>
   EMAIL_REPLY_TO=support@your-domain.com
   EMAIL_ADMIN_TO=owner@your-domain.com,orders@your-domain.com
   EMAIL_STORE_NAME=lahVenture
   EMAIL_LOGO_URL=https://your-domain.com/lahventure.png
   ```

`EMAIL_FROM` must use a sender address from your verified Resend domain. `EMAIL_ADMIN_TO` accepts one or more comma-separated recipients. `EMAIL_LOGO_URL` is optional; when it is omitted, emails use `${CLIENT_URL}/lahventure.png`.

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

## Hostinger MySQL

The backend can run against Hostinger MySQL by setting `DATABASE_PROVIDER=mysql`. The MySQL adapter stores each ecommerce document in MySQL tables with JSON payloads so the existing API continues to work while moving away from MongoDB.

Set these values in `.env`, `server/.env`, or your deployment environment:

```env
DATABASE_PROVIDER=mysql
MYSQL_HOST=<hostinger-mysql-host>
MYSQL_PORT=3306
MYSQL_USER=<hostinger-mysql-user>
MYSQL_PASSWORD=<hostinger-mysql-password>
MYSQL_DATABASE=<hostinger-mysql-database>
```

Then initialize/seed the MySQL tables:

```bash
npm run seed
npm run dev
```

Do not commit real MySQL credentials. If credentials were shared in chat or committed elsewhere, rotate the password in Hostinger before production use.

## Main Features

- Customer authentication, profile updates, wishlist, cart, coupon application, checkout, and order history
- Product catalog with search, category filtering, price filtering, sorting, stock status, product details, and reviews
- Admin dashboard with revenue, order, user, product, recent order, and low-stock metrics
- Admin product/category creation, product archiving, and order status updates
- Local image upload endpoints and static upload serving; on Vercel, images are returned as data URLs and saved in product records
- Seed data for categories, products, coupons, and demo users

## Useful Scripts

```bash
npm run dev          # client + server
npm run dev:server   # Express API only
npm run dev:client   # Vite client only
npm run seed         # reset and seed the selected database provider
npm run build        # build React client
npm test             # backend smoke tests
```

## Vercel Deployment

This repo includes `vercel.json` and `api/index.js` so Vercel can deploy the React app and route `/api/*` requests to the Express API.

Set these Vercel environment variables before deploying:

```bash
MONGO_URI=<your MongoDB Atlas connection string>
DATABASE_PROVIDER=mongodb
JWT_SECRET=<long random production secret>
JWT_EXPIRES_IN=7d
COOKIE_EXPIRES_DAYS=7
UPLOAD_DIR=uploads
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=<secure admin password>
RESEND_API_KEY=<your Resend API key>
EMAIL_FROM=lahVenture <orders@your-domain.com>
EMAIL_REPLY_TO=support@your-domain.com
EMAIL_ADMIN_TO=owner@your-domain.com,orders@your-domain.com
EMAIL_STORE_NAME=lahVenture
EMAIL_LOGO_URL=https://your-domain.com/lahventure.png
```

For Hostinger MySQL deployment, replace `MONGO_URI`/`DATABASE_PROVIDER=mongodb` with:

```bash
DATABASE_PROVIDER=mysql
MYSQL_HOST=<hostinger-mysql-host>
MYSQL_PORT=3306
MYSQL_USER=<hostinger-mysql-user>
MYSQL_PASSWORD=<hostinger-mysql-password>
MYSQL_DATABASE=<hostinger-mysql-database>
```

After the first deployment, set `CLIENT_URL` to the deployed Vercel URL, for example:

```bash
CLIENT_URL=https://your-project.vercel.app
```

Uploads use local filesystem storage in development. On Vercel, uploaded images are returned as data URLs so product creation works without a writable filesystem. For a real production store, use Cloudinary or S3 instead.
