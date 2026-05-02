# Laptop Retail Website

Full-stack laptop retail web app for the IWS final project.

## What this project includes

- Customer auth flow: sign in/register in one route, forgot password, reset password
- Product catalog with filtering, sorting, pagination, and comparison
- Product detail with add-to-cart and review CRUD
- API-backed cart and checkout flows
- Account hub, addresses CRUD/default handling, orders list/detail/cancel
- Manager-only internal product CRUD studio
- Resettable Prisma seed for deterministic local demo data

## Repository structure

```text
.
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── tests/
│   └── README.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   └── test/
│   └── README.md
```

## Prerequisites

- Node.js 20+
- npm 10+

## Quick start

Run these commands from the repository root:

1. Install dependencies:
   - `npm install --prefix backend`
   - `npm install --prefix frontend`
2. Prepare local database:
   - `npm run prisma:generate --prefix backend`
   - `npm run prisma:seed:reset --prefix backend`
   - This recreates the local SQLite demo state with accounts, products, cart items, an order, an address, and reviews.
3. Start backend (Terminal 1, choose one):
   - Explicit dev secret: `JWT_SECRET=dev-insecure-jwt-secret ENABLE_DEMO_RESET_TOKEN=true npm run dev --prefix backend`
   - Env fallback mode: `ALLOW_INSECURE_DEV_JWT=true ENABLE_DEMO_RESET_TOKEN=true npm run dev --prefix backend`
4. Start frontend (Terminal 2):
   - `npm run dev --prefix frontend`
5. Open `http://localhost:5173`

## Default local URLs

- Frontend: `http://localhost:5173`
- Backend API base: `http://localhost:8080/api/v1`
- Backend health: `http://localhost:8080/health`

## Seeded demo accounts

- Manager: `manager@laptop.local` / `Manager@123`
- Demo customer: `demo.customer@laptop.local` / `DemoCustomer@123`

## Common commands

- Backend tests: `npm test --prefix backend`
- Frontend lint: `npm run lint --prefix frontend`
- Frontend unit tests: `npm run test:run --prefix frontend`
- Frontend build: `npm run build --prefix frontend`

## Recommended verification gate

Run before handoff:

1. `npm test --prefix backend`
2. `npm run lint --prefix frontend`
3. `npm run test:run --prefix frontend`
4. `npm run build --prefix frontend`

## Submission checklist (IWS)

- Confirm backend and frontend source are included in final archive.
- Include personal report from each group member with contribution evidence screenshots.
- Package one zip file using the required naming convention from the course spec.
- Re-check exact filename punctuation and spacing before upload.

## Notes

- The frontend consumes live API data for products, product detail, cart, and checkout.
- Backend and frontend runbooks live in `backend/README.md` and `frontend/README.md`.
- Rerun `npm run prisma:seed:reset --prefix backend` whenever you want to restore the demo state.
