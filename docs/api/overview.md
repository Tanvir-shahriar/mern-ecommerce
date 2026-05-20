# API Overview

Base URL: `http://localhost:5001/api`

Core routes:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /products`
- `GET /products/featured`
- `GET /products/:slugOrId`
- `POST /products/:id/reviews`
- `GET /categories`
- `GET /cart`
- `POST /cart/items`
- `PATCH /cart/items/:id`
- `DELETE /cart/items/:id`
- `POST /cart/coupon`
- `POST /orders`
- `GET /orders/mine`
- `GET /admin/dashboard`

Admin-only routes:

- `POST /categories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`
- `POST /products`
- `PATCH /products/:id`
- `DELETE /products/:id`
- `GET /orders`
- `PATCH /orders/:id/status`
- `GET /users`
- `PATCH /users/:id/role`
- `POST /uploads/products`
