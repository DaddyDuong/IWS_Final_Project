# Backend Architecture

## Purpose
This backend is an Express + Prisma API for an e-commerce flow: user auth, product browsing, cart management, address book management, order checkout/history, and product reviews. The codebase is organized around route modules, shared middlewares, and small helper libraries rather than a layered service/repository split.

## API Surface
Mounted routes in `backend/src/app.js`:

- `GET /health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/users/me`
- `GET /api/v1/products`
- `GET /api/v1/products/:id`
- `POST /api/v1/internal/products`
- `PATCH /api/v1/internal/products/:id`
- `DELETE /api/v1/internal/products/:id`
- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PATCH /api/v1/cart/items/:id`
- `DELETE /api/v1/cart/items/:id`
- `GET /api/v1/addresses`
- `POST /api/v1/addresses`
- `PATCH /api/v1/addresses/:id`
- `DELETE /api/v1/addresses/:id`
- `POST /api/v1/orders/checkout`
- `GET /api/v1/orders`
- `GET /api/v1/orders/:id`
- `PATCH /api/v1/orders/:id/cancel`
- `GET /api/v1/products/:id/reviews`
- `POST /api/v1/products/:id/reviews`
- `PATCH /api/v1/reviews/:id`
- `DELETE /api/v1/reviews/:id`

## Request Pipeline
`backend/src/app.js` sets the global pipeline in this order:

1. `helmetMiddleware`
2. `corsMiddleware`
3. `globalRateLimiter`
4. `express.json({ limit: '32kb' })`
5. route registration
6. `notFoundHandler`
7. `errorHandler`

Route-level auth is layered on top of that. `authRoutes` also gets `authRateLimiter`, and protected modules use `requireAuth` or `requireRole('manager')` where needed.

## Validation and Sanitization
Validation is schema-driven with Zod in `backend/src/middlewares/validate.js`.

- `validateBody(schema)` parses `req.body`, stores the result on `req.validatedBody`, and returns a standardized `VALIDATION_ERROR` on failure.
- `validateQuery(schema)` does the same for `req.query` and stores `req.validatedQuery`.

Sanitization happens in two places:

- `backend/src/middlewares/sanitize.js` recursively strips `<` and `>` and trims string values in request bodies.
- Auth routes define a local `sanitizeAuthText()` helper that strips `<` and `>` and trims email, full name, and phone inputs before schema validation.
- `sanitizeRequestTextFields` is used by addresses, reviews, and internal product routes; products, cart, and orders do not use it.

This means validation usually runs on normalized input, but the behavior is route-specific rather than centralized.

## Security and Auth
Security middleware in `backend/src/middlewares/security.js` applies:

- `helmet()` for baseline headers
- CORS allow-listing against `env.security.corsAllowedOrigins`
- global and auth-specific rate limiting with a shared 429 error shape

Authentication uses bearer tokens in `backend/src/middlewares/auth.js`:

- `requireAuth` expects `Authorization: Bearer <token>`
- tokens are verified with `verifyAuthToken()` from `backend/src/lib/jwt.js`
- the token `sub` is used to load the current user from Prisma
- `req.authUser` is populated with a public user projection

Authorization is role-based where needed:

- `requireRole('manager')` protects the internal product routes

Password reset uses a hashed one-time token flow:

- `createPasswordResetToken()` generates a random token and SHA-256 hash
- only the hash is stored
- reset tokens expire after 15 minutes
- password reset invalidates remaining active tokens for the same user

`backend/src/middlewares/sanitize.js` recursively strips `<` and `>` from string input in request bodies before validation is applied.

## Pagination and Sorting Helpers
`backend/src/lib/listQuery.js` provides the shared list-query contract:

- `buildListQuerySchema({ sortByValues, defaultSortBy, defaultLimit })`
- `getListSkip(page, limit)`
- `buildListMeta({ page, limit, total })`

Routes use this helper for list endpoints such as cart, addresses, orders, and reviews. `backend/src/routes/products.routes.js` implements its own list-query schema, skip calculation, and meta shape inline. Supported query params follow the same pattern: `page`, `limit`, `sortBy`, and `sortOrder`, with route-specific filters layered on top.

## Data Model and Persistence
`backend/prisma/schema.prisma` defines a SQLite-backed model with these core entities:

- `User` with `role`, contact fields, and password hash
- `PasswordResetToken` with `tokenHash`, expiry, and used timestamp
- `Product` with soft-delete via `isDeleted`
- `CartItem` with a unique `(userId, productId)` constraint
- `Address` with `isDefault`
- `Order` and `OrderItem` for checkout snapshots and totals
- `Review` with a unique `(userId, productId)` constraint

The route code relies on Prisma transactions for stateful workflows that must stay consistent:

- checkout creates an order, decrements stock, and clears the cart atomically
- canceling an order restores stock atomically
- default-address changes clear other defaults in the same transaction
- product deletion is soft-delete plus cart cleanup

## Response Contract
Responses are consistently JSON and generally follow this shape:

- success: `{ success: true, data: ... }`
- failure: `{ success: false, error: { message, code?, details? } }`

List endpoints add `meta` with pagination totals:

- `page`
- `limit`
- `total`
- `totalPages`

Some routes return resource projections rather than raw Prisma objects. Examples include public users, public products, cart items with embedded product data, orders with embedded address and item data, and reviews with embedded user name.

## Testing Coverage
Test files exist for health, auth, cart, orders, addresses, products, reviews, security, and db behavior.
- `backend/tests/health.test.js` verifies `GET /health` returns the expected success payload.
- `backend/tests/auth/*`, `backend/tests/cart/*`, `backend/tests/orders/*`, `backend/tests/addresses/*`, `backend/tests/products/*`, `backend/tests/reviews/*`, `backend/tests/security/*`, and `backend/tests/db/*` document the repository's current route and helper coverage.

## Current Limitations
- There is no dedicated service layer; business rules live directly in route handlers.
- Validation and sanitization are implemented inconsistently across routes, so input handling is not fully uniform.
- `backend/src/routes/reviews.routes.js` exposes the create/list/update/delete review flow, but the delete route is mounted at `/api/v1/reviews/:id` while the product-scoped routes live under `/api/v1/products/:id/reviews`.
- The persistence layer is SQLite-specific in the checked-in Prisma schema, so this doc reflects the current schema rather than a database-agnostic abstraction.
- Product listing does not use the shared list helper, so query handling is duplicated for that route family.
