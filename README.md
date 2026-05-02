# Laptop Retail Website

Full-stack laptop retail web app for the IWS final project.

## What this project includes

- Customer auth flow: sign in/register in one route, forgot password, reset password
- Product catalog with filtering, sorting, pagination, and comparison
- Product detail with add-to-cart and review CRUD
- Cart and checkout flows
- Account hub, addresses CRUD/default handling, orders list/detail/cancel
- Manager-only internal product CRUD studio

## Repository structure

```text
.
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── tests/
│   └── README.md
├── frontend/            # active v2 redesign app
│   ├── public/
│   ├── src/
│   ├── tests/
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
    - `npm run prisma:seed --prefix backend`
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

## Seeded manager account

- Email: `manager@laptop.local`
- Password: `Manager@123`

## Common commands

- Backend tests: `npm test --prefix backend`
- Frontend lint: `npm run lint --prefix frontend`
- Frontend unit tests: `npm run test:run --prefix frontend`
- Frontend build: `npm run build --prefix frontend`
- Frontend E2E (flows + visual): `npm run e2e --prefix frontend`
- Frontend visual snapshot update: `npm run e2e:update-snapshots --prefix frontend`

## Recommended verification gate

Run before handoff:

1. `npm test --prefix backend`
2. `npm run lint --prefix frontend`
3. `npm run test:run --prefix frontend`
4. `npm run build --prefix frontend`
5. `npm run e2e --prefix frontend`

## Submission checklist (IWS)

- Confirm backend and frontend source are included in final archive.
- Include personal report from each group member with contribution evidence screenshots.
- Package one zip file using the required naming convention from the course spec.
- Re-check exact filename punctuation and spacing before upload.

## Notes

- Active frontend route contract is the consolidated v2 map documented in `frontend/README.md`.
- Backend and frontend runbooks live in `backend/README.md` and `frontend/README.md`.
- Frontend Playwright suite uses mock API fixtures by default; use a running backend for live integration checks.
