# Frontend Architecture

## Purpose
This document describes the current frontend architecture for teammates working in `frontend/`. It focuses on route structure, data access, auth/session state, component responsibilities, and current behavior as implemented in the repository.

## Boundaries
This is a frontend-only architecture snapshot.
- In scope: routing, pages, shared components, local state, React Query usage, Zustand auth state, and test coverage in `frontend/tests/e2e`.
- Out of scope: backend APIs, infra, deployment, and setup/run instructions.

## Routing And Layout
`frontend/src/app/AppRouter.jsx` defines the app routes under a single `AppLayout` shell.
- Public routes: `/`, `/shop`, `/shop/:productId`, `/auth`, `/auth/recovery`.
- Protected routes under `RequireAuth`: `/account`, `/cart`, `/checkout`, `/account/orders`, `/account/orders/:id`, `/account/addresses`.
- Manager-only route under `RequireManager`: `/manager/studio`.
- Unknown routes redirect to `/`.

`frontend/src/components/layout/AppLayout.jsx` renders the global shell and hides the primary nav on `/auth`.
`frontend/src/components/layout/MainNav.jsx` owns the top navigation, cart badge, and account link selection.
`frontend/src/components/layout/AccountSidebar.jsx` provides account-section navigation used by account pages.

## Data Access
`frontend/src/api/services.js` is the API boundary. It wraps `httpClient` calls and normalizes responses into a small set of shapes:
- single-resource fetches return `data` or `null`
- list endpoints return `{ items, meta }`

`frontend/src/hooks/useDomainData.js` centralizes React Query hooks and mutations.
- Query hooks cover me, catalog, product, reviews, cart, addresses, orders, and manager catalog.
- Mutation hooks group auth, cart, review, address, order, and manager-product operations.
- Mutations invalidate the relevant query keys, using both literal keys and `queryKeys.reviews(...)` from `frontend/src/hooks/queryKeys.js`.

Query state is mostly page-owned. Pages use `StateBlock` for loading/error/empty states and `AlertBox` for transient success/error feedback.

## Auth And Session State
`frontend/src/stores/authStore.js` persists session data in `localStorage` through Zustand persist middleware.
- Stored fields: `token` and `user`.
- `setSession`, `setUser`, and `clearSession` are the only session mutations.
- Persisted state is normalized before merge, which keeps old or malformed storage from breaking the store.

`RequireAuth` blocks anonymous access based on the token.
`RequireManager` loads `/users/me` via `useMeQuery`, seeds the store if needed, and redirects non-managers to `/account`.

## Component Responsibilities
Pages are organized by feature area, not by shared data shape.
- `HomePage` is static marketing content with CTAs into shop and auth.
- `ShopPage` owns catalog search params, filtering, pagination, and quick comparison.
- `ProductDetailPage` handles product details and product-level interactions.
- `AuthPage` handles sign-in and registration.
- `RecoveryPage` handles password recovery flow.
- `AccountPage` shows profile summary and recent orders.
- `CartPage` handles cart item updates and removal.
- `CheckoutPage` coordinates address selection and order placement.
- `OrdersPage` and `OrderDetailPage` manage order history and individual order review.
- `AddressesPage` manages saved shipping addresses.
- `ManagerStudioPage` provides internal product CRUD for managers.

Shared building blocks:
- `AlertBox` renders dismissible status messages.
- `StateBlock` standardizes loading, error, and empty-state rendering.
- `Pagination` is used by catalog and order list views.

## Error Handling And Empty States
The UI uses two main patterns.
- `StateBlock` surfaces request failure messages from API errors, falling back to a generic string when needed.
- `AlertBox` shows page-local success and failure feedback after mutations.

Pages also keep empty states explicit:
- cart empty state disables checkout
- checkout shows separate empty views when cart or addresses are missing
- account/orders, addresses, shop, and manager catalog all render empty-state copy instead of blank space

Current UX behavior is optimistic only at the refresh level: mutations generally wait for React Query invalidation rather than updating lists in place.

## Testing Coverage
`frontend/src/test` covers the lower-level helpers and shared UI behavior.
- `services.test.js`: request normalization and API wrapper behavior.
- `authSession.test.js`: persisted session normalization and storage shape.
- `catalogQuery.test.js` and `ordersQuery.test.js`: query normalization and search-param conversion helpers.
- `stateBlock.test.jsx`: nested error-message extraction from API error payloads.

`frontend/tests/e2e` covers the current user journeys.
- `navigation-auth.spec.js`: public navigation, auth page nav hiding, redirect-to-auth, sign-in return path, registration prefill, password recovery, role-based nav.
- `catalog-product.spec.js`: catalog filters, pagination, comparison strip, anonymous add-to-cart redirect, review lifecycle.
- `customer-journeys.spec.js`: cart updates, order placement/cancelation, order filters, empty-cart checkout guard, address CRUD/defaulting.
- `manager-journeys.spec.js`: manager product create/edit/soft delete flow.
- `visual.spec.js`: visual regression coverage exists, but this doc does not rely on its assertions.

## Current Limitations
- Route guards are token/role driven; there is no separate permission model beyond `manager` versus non-manager.
- `RequireManager` depends on a `me` fetch and briefly renders a loading state before role resolution.
- Most pages rely on shared error handling rather than page-specific recovery flows.
- Query invalidation is broad in a few places, so unrelated cached data may refresh after mutations.
- `MainNav` derives cart count from the cart query, so the badge depends on cart fetch availability for signed-in users.
- The architecture is page-centric; there is limited reuse of domain-specific view models outside the query and shared UI helpers.
- Automated coverage is split between helper-focused Vitest tests and end-to-end Playwright suites, so component-level tests are still limited.
