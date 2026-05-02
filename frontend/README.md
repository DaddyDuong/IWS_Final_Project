# Frontend App

React client for the Laptop Retail Website. It consumes the backend REST API and drives the product catalog, product detail, cart, checkout, and account flows from live data.

## Stack

- React 19 + Vite
- React Router 7
- TanStack Query for server state
- Zustand for auth token persistence
- Axios API client
- Vitest + Testing Library

## Project layout

```text
frontend/
├── public/
├── src/
│   ├── components/
│   ├── lib/
│   ├── pages/
│   ├── stores/
│   ├── test/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
└── vite.config.js
```

## Route map

Public:

- `/`
- `/products`
- `/products/:id`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

Protected (`RequireAuth`):

- `/profile`
- `/cart`
- `/checkout`
- `/profile/orders`
- `/profile/orders/:id`
- `/profile/addresses`

## Data and state flow

- `src/lib/apiClient.js` configures the Axios base URL via `VITE_API_BASE_URL`.
- `src/lib/customerApi.js` groups product, cart, checkout, review, address, and order API calls.
- `src/lib/buildProductQuery.js` normalizes catalog filters and keeps search params canonical.
- `src/stores/authStore.js` persists the JWT and user payload in local storage.
- `src/lib/queryClient.js` defines React Query defaults.

## Key pages

- `ProductsPage` owns catalog filters, pagination, and the comparison strip.
- `ProductDetailPage` handles the product view, reviews, and add-to-cart flow.
- `CartPage` handles quantity updates and item removal.
- `CheckoutPage` selects a saved address and places orders.
- `ProfilePage`, `OrdersPage`, `OrderDetailPage`, and `AddressesPage` cover account management.
- `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, and `ResetPasswordPage` cover auth.

## Run locally

Requirements:

- Node.js 20+
- Backend API running at `http://localhost:8080/api/v1`

Commands:

1. Install dependencies:
   - `npm install`
2. Seed and start the backend in another terminal:
   - `npm run prisma:seed:reset --prefix backend`
   - `JWT_SECRET=dev-insecure-jwt-secret ENABLE_DEMO_RESET_TOKEN=true npm run dev --prefix backend`
3. Start the frontend:
   - `npm run dev`
4. Open:
   - `http://localhost:5173`

## Environment variable

- `VITE_API_BASE_URL`: backend API base URL
- Default in code: `http://localhost:8080/api/v1`
- Override example: `VITE_API_BASE_URL=http://localhost:8080/api/v1 npm run dev`

## Scripts

- `npm run dev`: start Vite dev server
- `npm run build`: production build
- `npm run preview`: preview build
- `npm run lint`: ESLint
- `npm run test`: Vitest watch
- `npm run test:run`: Vitest one-shot

## Testing

- Unit and component tests live in `src/test/`.
- Tests mock API responses and cover query helpers, page behavior, and auth/session state.
- There is no frontend Playwright suite in this repository right now; use the seeded backend for manual integration checks.

## Troubleshooting

- If protected routes keep bouncing to login, clear local storage and sign in again.
- If data does not load, verify `VITE_API_BASE_URL` and that the backend is running.
- If seeded demo data looks stale, rerun `npm run prisma:seed:reset --prefix backend`.
