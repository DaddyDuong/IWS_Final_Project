# Laptop Retail Website

Full-stack laptop retail web app for the IWS final project. This repository is organized for team handoff, so each member can run the project quickly and locate the files they need to edit.

## What this project includes

- Customer auth flow: register, login, forgot password, reset password
- Product catalog with server-side filtering, sorting, and pagination
- Cart flow: add, update quantity, remove item
- Checkout flow that creates orders and clears cart in one transaction
- Account features: profile, addresses CRUD, order history/detail/cancel
- Reviews CRUD per product
- Manager-only internal product CRUD API endpoints

## Repository structure

```text
.
├── backend/
│   ├── prisma/         # schema, migrations, seed data
│   ├── src/            # app, routes, middlewares, libs
│   ├── tests/          # backend integration tests
│   └── README.md
└── frontend/
    ├── src/            # pages, components, client libs, stores
    ├── public/
    └── README.md
```

## Prerequisites

- Node.js 20+
- npm 10+

## Quick start (team handoff)

Run these commands from the repository root:

1. Install dependencies:
   - `npm install --prefix backend`
   - `npm install --prefix frontend`
2. Prepare local database:
   - `npm run prisma:migrate --prefix backend`
   - `npm run prisma:seed --prefix backend`
3. Start backend (Terminal 1):
   - `JWT_SECRET=dev-insecure-jwt-secret ENABLE_DEMO_RESET_TOKEN=true npm run dev --prefix backend`
4. Start frontend (Terminal 2):
   - `npm run dev --prefix frontend`
5. Open `http://localhost:5173`

## Teammate handoff map

- If you work on backend features, start at `backend/src/app.js`, then follow `backend/src/routes/`.
- If you work on frontend pages, start at `frontend/src/App.jsx`, then open `frontend/src/pages/`.
- If you work on shared API contracts, check both `backend/src/routes/` and `frontend/src/lib/customerApi.js`.

## Default local URLs

- Frontend: `http://localhost:5173`
- Backend API base: `http://localhost:8080/api/v1`
- Backend health: `http://localhost:8080/health`

## Seeded account

Manager account used for internal product CRUD API testing:

- Email: `manager@laptop.local`
- Password: `Manager@123`

## Where to look first

- Backend API runbook: `backend/README.md`
- Frontend app runbook: `frontend/README.md`

## Common commands

- Backend tests: `npm test --prefix backend`
- Frontend tests: `npm run test:run --prefix frontend`
- Frontend lint: `npm run lint --prefix frontend`
- Frontend build: `npm run build --prefix frontend`

## Troubleshooting

- If backend returns missing-table errors, run migrate + seed again.
- If forgot-password does not return a demo token locally, set `ENABLE_DEMO_RESET_TOKEN=true` before starting backend.
- If frontend cannot call backend, verify `VITE_API_BASE_URL` in `frontend` and CORS settings in `backend/src/config/env.js`.
