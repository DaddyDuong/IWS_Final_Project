# Defense Demo Script

## Goal

Demonstrate end-to-end user flow for the Laptop Retail Website and confirm key backend APIs are production-ready for project defense.

## Prep (5 minutes)

1. Start backend:
   - `cd backend`
   - `JWT_SECRET=dev-insecure-jwt-secret npm run dev`
2. Start frontend:
   - `cd frontend`
   - `npm run dev`
3. Open frontend at `http://localhost:5173`.
4. Import Postman collection from `docs/defense/postman/LaptopRetail.postman_collection.json`.

## Demo Timeline (12-18 minutes)

### 1) System Health and Setup (1 minute)

- Run `Health > GET /health`.
- Expected: `success=true` and `status=ok`.
- Explain architecture briefly: React frontend + Express/Prisma backend + SQLite.

### 2) Authentication (2 minutes)

- Run `Auth > POST /api/v1/auth/register` (or login if account already exists).
- Confirm JWT is captured in Postman variable `token`.
- Run `Users > GET /api/v1/users/me` to prove protected route authorization.

### 3) Manager JWT + Internal Product CRUD Proof (2-3 minutes)

- Run `Internal Manager Products > POST /api/v1/auth/login (manager)`.
- Confirm manager JWT is captured in Postman variable `managerToken`.
- Run `Internal Manager Products > POST /api/v1/internal/products` and verify `201` response.
- Run `Internal Manager Products > PATCH /api/v1/internal/products/:id` and verify updates.
- Run `Internal Manager Products > DELETE /api/v1/internal/products/:id` and verify soft-delete success.

### 4) Product Discovery (2 minutes)

- Run `Products > GET /api/v1/products` with filters/pagination parameters.
- Run `Products > GET /api/v1/products/:id` using captured `productId`.
- Mention support for sorting and search inputs in product list API.

### 5) Cart + Address + Checkout (4-5 minutes)

- Run `Cart > POST /api/v1/cart/items`.
- Run `Cart > GET /api/v1/cart` and explain line item detail payload.
- Run `Addresses > POST /api/v1/addresses` then `GET /api/v1/addresses`.
- Run `Orders > POST /api/v1/orders/checkout`.
- Highlight transactional behavior: stock validation, order creation, cart clearing.

### 6) Order Lifecycle (2-3 minutes)

- Run `Orders > GET /api/v1/orders` and `GET /api/v1/orders/:id`.
- Run `Orders > PATCH /api/v1/orders/:id/cancel`.
- Explain cancel guardrails (only cancellable statuses) and stock restoration.

### 7) Auth Rate-Limit 429 Proof (1-2 minutes)

- Run `Auth Rate Limit Proof > POST /api/v1/auth/login (invalid credentials)` repeatedly in Runner.
- Continue until backend returns `429 Too Many Requests`.
- Show `Retry-After` response header and explain this proves auth endpoint abuse protection.

### 8) Review Flow (optional, 1-2 minutes)

- Run `Reviews > POST /api/v1/products/:id/reviews`.
- Run `Reviews > GET /api/v1/products/:id/reviews`.
- Mention one-review-per-user-per-product conflict protection.

## Presenter Notes

- Keep Postman response panel visible for proof of result consistency.
- For frontend visuals, quickly mirror the same actions in UI (browse products, cart, checkout) while explaining that UI uses the same API base.
- If any request depends on previous IDs, use the auto-captured collection variables.

## Backup Plan

- If register fails due to duplicate email, use login endpoint.
- If manager login is unavailable, explain expected seeded manager account for defense and continue with customer flow.
- If checkout fails due to stock constraints, rerun product list and pick another product.
- If cancel fails with non-cancellable order status, show guardrail behavior and explain business rule.
