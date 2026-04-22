# Laptop Retail Website

This repository contains a full-stack laptop retail demo:
- `backend/`: Express + Prisma REST API
- `frontend/`: React + Vite client

## Prerequisites

- Node.js 20+
- npm 10+

## Run Instructions

1. Install dependencies:
   - `cd backend && npm install`
   - `cd frontend && npm install`
2. Start backend API (Terminal 1):
   - `cd backend`
   - `JWT_SECRET=dev-insecure-jwt-secret npm run dev`
3. Start frontend app (Terminal 2):
   - `cd frontend`
   - `npm run dev`
4. Open `http://localhost:5173`

Notes:
- Frontend defaults to `http://localhost:8080/api/v1`.
- Backend health check: `GET http://localhost:8080/health`.

## Defense Artifacts

- Postman collection: `docs/defense/postman/LaptopRetail.postman_collection.json`
- Demo walkthrough: `docs/defense/demo-script.md`
- Screenshots folder: `docs/defense/screenshots/`

## Demo Checklist

- [ ] Backend and frontend run locally.
- [ ] Postman environment variable `baseUrl` points to `http://localhost:8080`.
- [ ] Postman `Auth > Register` or `Auth > Login` returns a JWT and sets `token`.
- [ ] Product listing and product detail endpoints return expected data.
- [ ] Cart flow works: add item, view cart, update/remove item.
- [ ] Address flow works: create and list addresses.
- [ ] Checkout creates an order and clears the cart.
- [ ] Order listing/detail/cancel endpoints behave correctly.
- [ ] Optional: review create/list flow works on a chosen product.

## Verification Commands

- Backend tests: `cd backend && npm test`
- Frontend tests: `cd frontend && npm run test:run`
- Frontend build: `cd frontend && npm run build`
