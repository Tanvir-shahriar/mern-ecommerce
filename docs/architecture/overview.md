# Architecture

The project is split into workspaces:

- `server/`: Express API, MongoDB models, controllers, routes, validation, upload handling, and seed data.
- `client/`: Vite React app with customer storefront, account pages, cart, checkout, and admin screens.
- `shared/`: Reserved for shared types/constants if the app is migrated to TypeScript or shared packages.

The API uses JWTs in httpOnly cookies and also supports bearer tokens for API clients. Customer routes use `protect`; admin routes add `restrictTo('admin')`.

MongoDB collections:

- `users`: customers/admins, addresses, wishlist, account status
- `categories`: catalog grouping and featured category data
- `products`: catalog data, pricing, inventory, images, ratings, embedded reviews
- `carts`: one active cart per user, with coupon snapshot and totals
- `orders`: checkout snapshots, payment status, fulfillment status, timeline
- `coupons`: fixed or percentage promotions with limits and expiry support
