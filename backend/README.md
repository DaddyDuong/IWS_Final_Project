# Backend API

Express + Prisma REST API for the Laptop Retail Website.

## Stack

- Node.js + Express 5
- Prisma ORM + SQLite (`better-sqlite3` adapter)
- JWT authentication + role-based authorization
- Zod request validation + input sanitization for request bodies and auth fields
- Helmet, CORS allowlist, and rate limiting
- Vitest + Supertest integration tests

## Project layout

```text
backend/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.js
├── src/
│   ├── config/env.js
│   ├── lib/
│   ├── middlewares/
│   ├── routes/
│   ├── app.js
│   └── server.js
├── tests/
├── package.json
└── prisma.config.ts
```

## Run locally

1. Install packages:
   - `npm install`
2. Generate Prisma client:
   - `npm run prisma:generate`
3. Apply migrations:
   - `npm run prisma:migrate`
4. Seed database:
   - `npm run prisma:seed`
5. Start API server (choose one):
   - Explicit dev secret: `JWT_SECRET=dev-insecure-jwt-secret ENABLE_DEMO_RESET_TOKEN=true npm run dev`
   - Env fallback mode: `ALLOW_INSECURE_DEV_JWT=true ENABLE_DEMO_RESET_TOKEN=true npm run dev`

Default base URL: `http://localhost:8080`

## Environment variables

- `PORT`: API port (default `8080`)
- `DATABASE_URL`: SQLite URL (default `file:./prisma/dev.db`)
- `JWT_SECRET`: JWT signing secret (required unless insecure fallback is enabled)
- `ALLOW_INSECURE_DEV_JWT`: set `true` to allow fallback `dev-insecure-jwt-secret`
- `ENABLE_DEMO_RESET_TOKEN`: set `true` to include a one-time reset token in forgot-password response
- `CORS_ALLOWED_ORIGINS`: comma-separated allowlist (default `http://localhost:5173`)
- `TRUST_PROXY`: Express `trust proxy` value (`true`, `false`, number, or string)
- `GLOBAL_RATE_LIMIT_WINDOW_MS` and `GLOBAL_RATE_LIMIT_MAX`
- `AUTH_RATE_LIMIT_WINDOW_MS` and `AUTH_RATE_LIMIT_MAX`

## API route map

- Health endpoint (outside API prefix):
  - `GET /health`
- Base path for all routes below: `/api/v1`
- Public:
  - `GET /products`
  - `GET /products/:id`
  - `GET /products/:id/reviews`
- Auth:
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/forgot-password`
  - `POST /auth/reset-password`
- Authenticated user:
  - `GET /users/me`
  - `GET /cart`
  - `POST /cart/items`
  - `PATCH /cart/items/:id`
  - `DELETE /cart/items/:id`
  - `GET /addresses`
  - `POST /addresses`
  - `PATCH /addresses/:id` (returns `409 ADDRESS_IN_USE` once the address has been used by an order)
  - `DELETE /addresses/:id` (returns `409 ADDRESS_IN_USE` once the address has been used by an order)
  - `POST /orders/checkout` (skips stale cart items for soft-deleted products)
  - `GET /orders`
  - `GET /orders/:id`
  - `PATCH /orders/:id/cancel`
  - `POST /products/:id/reviews`
  - `PATCH /reviews/:id`
  - `DELETE /reviews/:id`
- Manager role only:
  - `POST /internal/products`
  - `PATCH /internal/products/:id`
  - `DELETE /internal/products/:id` (soft delete + cart cleanup)

## Collection query parameters

All multi-record GET endpoints use server-side pagination via `page` + `limit`.

- `GET /api/v1/products`
  - Sorting: `sortBy` (`createdAt`, `price`, `name`), `sortOrder` (`asc`, `desc`)
  - Search/filter: `q`, `brand`, `cpu`, `ram`, `storage`, `minPrice`, `maxPrice`, `inStock`
- `GET /api/v1/products/:id/reviews`
  - Sorting: `sortBy` (`createdAt`, `rating`), `sortOrder` (`asc`, `desc`)
  - Filters: `rating`, `hasComment`
- `GET /api/v1/orders`
  - Sorting: `sortBy` (`placedAt`, `total`, `status`), `sortOrder` (`asc`, `desc`)
  - Filters: `status`, `from`, `to`, `minTotal`, `maxTotal`
- `GET /api/v1/cart`
  - Sorting: `sortBy` (`createdAt`, `updatedAt`), `sortOrder` (`asc`, `desc`)
- `GET /api/v1/addresses`
  - Sorting: `sortBy` (`createdAt`, `updatedAt`, `receiver`), `sortOrder` (`asc`, `desc`)

## Behavior notes

- Auth requests trim and sanitize email, full name, phone, and reset-token inputs before validation.
- Checkout ignores stale cart entries whose products were soft-deleted and removes them from the cart.
- Address updates and deletes are blocked after an address has been used in an order, preserving order history.

## Response contract

- Success: `{ "success": true, "data": ... }` (some list endpoints also include `meta`)
- Error: `{ "success": false, "error": { "message": "...", "code": "..." } }`

## Scripts

- `npm run dev`: run API server
- `npm run start`: run API server
- `npm test`: run backend test suite
- `npm run prisma:generate`: generate Prisma client
- `npm run prisma:migrate`: run local migrations
- `npm run prisma:seed`: seed local data

## Testing

- Full suite: `npm test`
- Example focused runs:
  - `npm test -- tests/products/listProducts.test.js`
  - `npm test -- tests/orders/checkout.test.js`
  - `npm test -- tests/security/rateLimit.test.js`

## Verification gate

Run before handoff:

1. `npm test`

## Seeded data

`prisma/seed.js` creates or updates:

- Manager user: `manager@laptop.local` / `Manager@123`
- Sample products for catalog, cart, and checkout tests

## Troubleshooting

- `JWT_SECRET is required`: set `JWT_SECRET` or set `ALLOW_INSECURE_DEV_JWT=true`.
- `table not found` or Prisma model errors: re-run `npm run prisma:migrate` and `npm run prisma:seed`.
- CORS blocked in browser: confirm frontend origin is in `CORS_ALLOWED_ORIGINS`.
- Forgot-password does not return demo token: set `ENABLE_DEMO_RESET_TOKEN=true`.
