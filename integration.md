# Project Integrations

This document lists the integrations currently present in the lahVenture MERN ecommerce project. It is based on the current codebase, including server, client, deployment, environment examples, and documentation files.

## Summary

| Area | Integration | Status | Primary files |
| --- | --- | --- | --- |
| Client/API | React client to Express API via Axios | Active | `client/src/services/api.js`, `client/vite.config.js`, `server/src/app.js` |
| Database | MongoDB with Mongoose | Active default | `server/src/config/db.js`, `server/src/models/*.js`, `.env.example` |
| Database | MySQL/Hostinger via `mysql2` JSON-document adapter | Active optional | `server/src/config/mysql.js`, `server/src/models/mysql/*`, `server/src/config/env.js` |
| Local services | Docker MongoDB and mongo-express | Active for local dev | `docker-compose.yml` |
| Authentication | Email/password with JWT httpOnly cookie | Active | `server/src/controllers/auth.controller.js`, `server/src/utils/tokens.js`, `client/src/contexts/AuthContext.jsx` |
| Authentication | Google Sign-In / Google Identity Services | Active when configured | `client/src/hooks/useSocialAuth.js`, `server/src/controllers/auth.controller.js`, `client/src/main.jsx` |
| Authentication | Facebook Login / Graph API token verification | Active when configured | `client/src/hooks/useSocialAuth.js`, `server/src/controllers/auth.controller.js` |
| Authentication | Apple sign-in UI | Placeholder only | `client/src/pages/LoginPage.jsx`, `client/src/pages/RegisterPage.jsx` |
| Email | Resend transactional email | Active when configured | `server/src/services/email.service.js`, `README.md` |
| Realtime | Socket.IO order sync | Active | `server/src/sockets/socket.js`, `client/src/components/OrderRealtimeSync.jsx` |
| Currency | ExchangeRate-API open access endpoint | Active | `server/src/services/currency.service.js`, `client/src/contexts/CurrencyContext.jsx` |
| Payments | Manual payment settings: cash, bank transfer, mobile banking | Active | `server/src/services/paymentSettings.service.js`, `client/src/pages/CheckoutPage.jsx`, `client/src/pages/AdminPaymentMethodsPage.jsx` |
| Payments | Stripe, PayPal, card gateways | Not implemented | Labels only in `client/src/utils/payments.js`, `server/src/services/email.service.js`, `server/src/models/order.model.js` |
| Uploads | Multer local uploads and Vercel in-memory data URLs | Active | `server/src/middleware/upload.middleware.js`, `server/src/controllers/upload.controller.js`, `server/src/routes/upload.routes.js` |
| Deployment | Vercel serverless API and SPA rewrites | Active | `vercel.json`, `api/index.js`, `README.md` |
| SEO | Dynamic sitemap and robots endpoints | Active | `server/src/controllers/sitemap.controller.js`, `vercel.json`, `client/vite.config.js` |
| External media/CDN | Unsplash, Google Fonts, Tailwind CDN, GSAP, Icons8 | Active where referenced | `client/index.html`, `client/src/pages/AboutPage.jsx`, `client/src/services/api.js`, `server/src/services/email.service.js` |

## Client To API Integration

The React frontend talks to the backend through a shared Axios client.

- Client API base: `VITE_API_URL`, defaulting to `/api`.
- Server/media base: `VITE_SERVER_URL`, used for `/uploads/*` media URLs.
- Axios is configured with `withCredentials: true` so browser requests include the auth cookie.
- In development, Vite proxies `/api`, `/uploads`, `/sitemap.xml`, and `/robots.txt` to `http://localhost:5001`.

Relevant files:

- `client/src/services/api.js`
- `client/vite.config.js`
- `server/src/app.js`

Environment:

```env
VITE_API_URL=http://localhost:5001/api
VITE_SERVER_URL=http://localhost:5001
CLIENT_URL=http://localhost:5173
```

## Database Integrations

### MongoDB / Mongoose

MongoDB is the default database provider.

- Connection is controlled by `MONGO_URI`.
- `server/src/config/db.js` uses `mongoose.connect`.
- Production disables automatic index creation with `autoIndex: !env.isProduction`.
- Tests use `mongodb-memory-server`.

Environment:

```env
DATABASE_PROVIDER=mongodb
MONGO_URI=mongodb://127.0.0.1:27017/mern_ecommerce
```

Main collections/models include users, products, categories, brands, carts, orders, coupons, payment settings, currency settings, gallery, hero settings, brand page settings, search logs, and contact messages.

### MySQL / Hostinger

The server can use MySQL by setting `DATABASE_PROVIDER=mysql`.

- Uses `mysql2/promise`.
- `server/src/config/mysql.js` creates a pool.
- Tables are created automatically if they do not exist.
- Each domain model is stored in a table as JSON payload data with `id`, `data`, `created_at`, and `updated_at`.
- This keeps the API shape close to the MongoDB implementation while allowing Hostinger/MySQL deployment.

Environment:

```env
DATABASE_PROVIDER=mysql
MYSQL_HOST=<hostinger-mysql-host>
MYSQL_PORT=3306
MYSQL_USER=<hostinger-mysql-user>
MYSQL_PASSWORD=<hostinger-mysql-password>
MYSQL_DATABASE=<hostinger-mysql-database>
```

### Docker Local MongoDB

`docker-compose.yml` provides:

- `mongo:7` on host port `27017`.
- `mongo-express:1` on host port `8081`.
- Persistent `mongo_data` volume.

## Authentication Integrations

### Email/Password JWT Auth

The built-in auth flow uses JWTs.

- Login/register endpoints create a JWT.
- Token is stored in an httpOnly cookie named `token`.
- Protected API routes also accept a `Bearer` token from the `Authorization` header.
- Cookie behavior is controlled by `JWT_SECRET`, `JWT_EXPIRES_IN`, `COOKIE_EXPIRES_DAYS`, and `COOKIE_SAME_SITE`.

Relevant routes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/auth/me`
- `PATCH /api/auth/password`

Environment:

```env
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
COOKIE_EXPIRES_DAYS=7
COOKIE_SAME_SITE=lax
```

### Google Sign-In

Google auth is wired on both client and server.

- Client loads Google Identity Services from `https://accounts.google.com/gsi/client`.
- Client sends the Google ID token to `POST /api/auth/social`.
- Server verifies the token with `google-auth-library` and the configured `GOOGLE_CLIENT_ID`.
- If the Google email is verified, the server finds or creates a user.
- `@react-oauth/google` wraps the React app in `GoogleOAuthProvider`.

Expected environment variables:

```env
VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_ID=<same-google-oauth-client-id>
```

Note: these variables are referenced by the code but are not currently listed in the checked-in `.env.example` files.

### Facebook Login

Facebook auth is wired on both client and server.

- Client loads the Facebook SDK from `https://connect.facebook.net/en_US/sdk.js`.
- Client calls `FB.login` with `public_profile,email`.
- Client sends the Facebook access token to `POST /api/auth/social`.
- Server verifies the access token with `https://graph.facebook.com/debug_token`.
- Server fetches profile data from `https://graph.facebook.com/me?fields=id,name,email`.
- If Facebook does not provide an email, the server asks the user to use email/password registration.

Expected environment variables:

```env
VITE_FACEBOOK_APP_ID=<facebook-app-id>
FACEBOOK_APP_ID=<facebook-app-id>
FACEBOOK_APP_SECRET=<facebook-app-secret>
```

Note: these variables are referenced by the code but are not currently listed in the checked-in `.env.example` files.

### Apple Sign-In

Apple buttons are present in login/register UI, but disabled and marked as coming soon. There is no Apple OAuth verification endpoint or client flow currently implemented.

## Email Integration: Resend

Transactional emails are implemented through Resend.

The server sends:

- Customer order confirmation emails.
- Admin new-order notification emails.
- Customer order status/detail update emails.
- Admin notification when manual payment details are submitted.

Email sending is skipped safely when `RESEND_API_KEY` or `EMAIL_FROM` is missing.

Environment:

```env
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=lahVenture <orders@your-domain.com>
EMAIL_REPLY_TO=support@your-domain.com
EMAIL_ADMIN_TO=owner@your-domain.com,orders@your-domain.com
EMAIL_STORE_NAME=lahVenture
EMAIL_LOGO_URL=https://your-domain.com/lahventure.png
```

Relevant files:

- `server/src/services/email.service.js`
- `server/src/controllers/order.controller.js`
- `README.md`

External assets used in emails:

- Order progress icons are loaded from `https://img.icons8.com/...`.
- Store logo uses `EMAIL_LOGO_URL`, or falls back to `${CLIENT_URL}/lahventure.png`.

## Realtime Integration: Socket.IO

The project uses Socket.IO for realtime order updates.

Server:

- Initializes Socket.IO when the HTTP server starts.
- Allows CORS origins from `CLIENT_URL` / `VERCEL_URL`.
- Supports rooms:
  - `user:<userId>`
  - `admin`
- Emits:
  - `order:created`
  - `order:updated`

Client:

- Connects with `socket.io-client`.
- Joins the user room after authentication.
- Admin users also join the `admin` room.
- Invalidates TanStack Query caches for order/dashboard data when events arrive.

Relevant files:

- `server/src/sockets/socket.js`
- `server/src/server.js`
- `client/src/components/OrderRealtimeSync.jsx`

## Currency Integration

The app supports international display currencies while storing prices in BDT.

- Base currency is `BDT`.
- Exchange rate provider URL: `https://open.er-api.com/v6/latest/BDT`.
- Rates refresh automatically every 12 hours when enabled.
- Admin can force refresh rates from `/admin/currency`.
- Admin can enable/disable currencies and mark manual exchange rates.
- Client stores the selected currency in `localStorage` under `lahventure_currency`.

Country/currency auto-detection uses, in order:

- Query parameter `country`.
- Headers `x-vercel-ip-country`, `cf-ipcountry`, `cloudfront-viewer-country`, `x-country-code`.
- Query/header timezone.
- `Accept-Language` region.

Relevant files:

- `server/src/services/currency.service.js`
- `server/src/controllers/currency.controller.js`
- `client/src/contexts/CurrencyContext.jsx`
- `client/src/pages/AdminCurrencyPage.jsx`

Routes:

- `GET /api/currency`
- `GET /api/admin/currency`
- `PATCH /api/admin/currency`
- `POST /api/admin/currency/refresh`

## Payment Integrations

### Active Manual Payments

The active checkout payment system is manual, not gateway-based.

Supported active payment methods:

- `cash_on_delivery`
- `bank_transfer`
- `mobile_banking`

Admin users can configure:

- Method enabled/disabled state.
- Labels and instructions.
- Bank account name, account number, bank name, district, branch, routing number.
- Mobile banking provider, payment type, account name, account number.
- Payment method image.

Customers can:

- Select an enabled payment method at checkout.
- View payment instructions.
- Submit sender account number, optional transaction ID, and proof images for bank/mobile payments.

Routes:

- `GET /api/payment-methods`
- `GET /api/admin/payment-methods`
- `PATCH /api/admin/payment-methods`
- `POST /api/orders`
- `PATCH /api/orders/:id/payment`
- `POST /api/uploads/payments`

Relevant files:

- `server/src/services/paymentSettings.service.js`
- `server/src/controllers/payment.controller.js`
- `server/src/controllers/order.controller.js`
- `client/src/pages/CheckoutPage.jsx`
- `client/src/pages/AdminPaymentMethodsPage.jsx`
- `client/src/utils/payments.js`

### Gateway Placeholders

The codebase contains labels/enums for `card`, `paypal`, and `stripe` in presentation or model code, but there is no live Stripe, PayPal, card processor, bKash, or Nagad gateway integration currently implemented.

## Upload And Media Integration

Uploads are handled with Multer.

Storage behavior:

- Local/dev: files are saved under `server/<UPLOAD_DIR>/<folder>`.
- Vercel/serverless: Multer uses memory storage and returns data URLs because the filesystem is not writable.

Environment:

```env
UPLOAD_DIR=uploads
UPLOAD_FILE_SIZE_MB=4
UPLOAD_MAX_FILES=8
```

Upload routes:

- `POST /api/uploads/payments` - authenticated users, up to 5 payment proof images.
- `POST /api/uploads/products` - admin only, up to 8 product images.
- `POST /api/uploads/users` - admin only, one user image.
- `POST /api/uploads/gallery` - admin only, up to 50 gallery images.
- `POST /api/uploads/hero` - admin only, up to 12 image/video media files.
- `POST /api/uploads/brands` - admin only, up to 4 brand images.

Relevant files:

- `server/src/middleware/upload.middleware.js`
- `server/src/controllers/upload.controller.js`
- `server/src/routes/upload.routes.js`
- `server/src/app.js`

Note: README mentions Cloudinary or S3 as recommended future production storage, but neither is currently integrated.

## Deployment Integrations

### Vercel

The project includes Vercel deployment support.

- `vercel.json` builds the client with `npm run build`.
- Output directory is `client/dist`.
- `api/index.js` wraps the Express app as a Vercel serverless function.
- Rewrites send:
  - `/api/*` to `/api/index.js`
  - `/uploads/*` to `/api/index.js`
  - `/sitemap.xml` to `/api/index.js`
  - `/robots.txt` to `/api/index.js`
  - all other routes to `/index.html`
- `VERCEL_URL` is automatically accepted as a client origin when present.

Relevant files:

- `vercel.json`
- `api/index.js`
- `server/src/config/env.js`

### Hostinger MySQL

Hostinger is supported through the optional MySQL provider. See the MySQL section above.

### Local Development

Local app defaults:

- Client: `http://localhost:5173`
- API: `http://localhost:5001`
- MongoDB: `mongodb://127.0.0.1:27017/mern_ecommerce`
- mongo-express: `http://localhost:8081`

## SEO And Public Metadata

The API serves dynamic sitemap and robots responses.

- `GET /sitemap.xml`
- `GET /robots.txt`
- Also routed through `/api` by `server/src/app.js`.

Sitemap includes:

- Home page.
- Products page.
- Brands page.
- Category filter URLs.
- Brand filter URLs.
- Active product detail URLs.

Robots disallows private or transactional routes such as admin, cart, checkout, account, and order pages.

Relevant files:

- `server/src/controllers/sitemap.controller.js`
- `server/src/routes/sitemap.routes.js`
- `client/public/sitemap.xml`
- `client/public/robots.txt`
- `client/src/components/Seo.jsx`

## External Frontend Media And CDN References

The project references several external static/CDN resources:

- Unsplash image URLs for fallback media, gallery defaults, seed data, and CSS background imagery.
- Google Fonts in `client/index.html`, `client/src/pages/AboutPage.jsx`, and CSS.
- Tailwind CDN in `client/src/pages/AboutPage.jsx`.
- GSAP from `https://unpkg.com/gsap@3/dist/gsap.min.js`.
- MorphSVGPlugin from `https://assets.codepen.io/16327/MorphSVGPlugin3.min.js`.
- Google Maps search link on the contact page.
- Schema.org JSON-LD metadata on storefront pages.

Relevant files:

- `client/index.html`
- `client/src/pages/AboutPage.jsx`
- `client/src/pages/ContactPage.jsx`
- `client/src/pages/HomePage.jsx`
- `client/src/pages/ProductsPage.jsx`
- `client/src/pages/ProductDetailPage.jsx`
- `client/src/pages/BrandsPage.jsx`
- `client/src/services/api.js`
- `client/src/components/PanoramicPhotoLibrary.jsx`
- `server/src/seeders/seed.js`
- `server/src/seeders/populateGallery.js`

## Security And Cross-Origin Integration

The server integrates client origin checks and common HTTP hardening middleware.

- CORS allows only configured client origins and credentialed requests.
- Trusted origin enforcement checks `Origin` or `Referer` on unsafe methods.
- Helmet sets security headers.
- `express-rate-limit` applies global, auth, write, and upload limits.
- `express-mongo-sanitize` and custom sanitization protect query/body data.
- `hpp` protects against HTTP parameter pollution.
- Private API responses receive `Cache-Control: no-store`.

Relevant files:

- `server/src/app.js`
- `server/src/middleware/security.middleware.js`
- `server/src/utils/sanitizeMongo.js`

Environment:

```env
CLIENT_URL=http://localhost:5173
```

Multiple client origins can be configured as a comma-separated `CLIENT_URL` value.

## Not Currently Integrated

These items appear as placeholders, labels, docs suggestions, or future recommendations, but no active production integration exists in the current code:

- Stripe payment gateway.
- PayPal payment gateway.
- Direct card processor.
- bKash or Nagad gateway APIs.
- Apple sign-in backend verification.
- Cloudinary media storage.
- Amazon S3 media storage.
- SMTP email transport separate from Resend.
