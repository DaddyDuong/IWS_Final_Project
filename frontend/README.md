# Frontend (V2 Redesign)

React + Vite frontend rebuilt from scratch for the consolidated UX route map.

## Stack

- React 19 + Vite
- React Router
- TanStack Query
- Zustand
- Axios
- Vitest
- Playwright (desktop + mobile)

## Route contract

- Public:
  - `/`
  - `/shop`
  - `/shop/:productId`
  - `/auth`
  - `/auth/recovery`
- Protected customer routes:
  - `/account`
  - `/cart`
  - `/checkout`
  - `/account/orders`
  - `/account/orders/:id`
  - `/account/addresses`
- Protected manager route:
  - `/manager/studio`

No legacy route redirects are included.

## API and auth state

- Backend API base URL comes from `VITE_API_BASE_URL` (default fallback in code is `http://localhost:8080/api/v1`).
- Session namespace is isolated to:
  - `localStorage` key: `iws-v2-auth-session`

## Project layout

```text
frontend/
├── public/
├── src/
│   ├── api/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── stores/
│   ├── styles/
│   ├── test/
│   └── utils/
├── tests/e2e/
├── playwright.config.js
└── vitest.config.js
```

## Commands

- `npm run dev`: start Vite dev server
- `npm run build`: production build
- `npm run preview`: preview build
- `npm run lint`: ESLint
- `npm run test`: Vitest watch
- `npm run test:run`: Vitest one-shot
- `npm run e2e`: Playwright flow + visual suites
- `npm run e2e:visual`: Playwright visual suite only
- `npm run e2e:update-snapshots`: refresh visual baselines

## Test architecture

- Unit tests (`npm run test:run`) validate query utilities and auth session behavior.
- E2E tests (`npm run e2e`) use the in-repo mock API fixture at `tests/e2e/fixtures/mockApi.js`.
- Visual coverage includes responsive snapshots for the main flows, including the empty-cart checkout-disabled state.
- Because E2E runs on mocked API responses, backend does not need to be running for Playwright suites.
- For real API integration checks, run backend + frontend dev servers and test flows manually in browser.

## Verification gate

Run before handoff:

1. `npm run lint`
2. `npm run test:run`
3. `npm run build`
4. `npm run e2e`

## Troubleshooting

- If protected routes bounce to `/auth`, clear `iws-v2-auth-session` in localStorage and sign in again.
- If API calls fail, verify backend is running and `VITE_API_BASE_URL` is correct.
- If E2E passes but live API flow fails, remember Playwright suite is mock-driven; re-check against a running backend.
- If visual tests fail after intended UI updates, run `npm run e2e:update-snapshots` and re-run `npm run e2e`.
