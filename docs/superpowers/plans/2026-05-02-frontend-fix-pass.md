# Frontend Fix Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the frontend review findings with the smallest correct pass: accessible navigation, only-real routes in marketing CTAs, expired-token handling, and mobile-safe catalog/detail layout cleanup.

**Architecture:** Keep the current React Router + React Query + Zustand shape. Prefer route correction and CSS/layout fixes over adding new product filters or new navigation destinations. Use the existing auth store as the source of truth for token validity, and keep API fetching in `apiClient`/`customerApi` unchanged apart from auth header behavior.

**Tech Stack:** React 19, React Router, React Query, Zustand, Axios, Vite, Vitest, Testing Library, CSS.

---

### Task 1: Fix header navigation and dead home CTAs

**Files:**
- Modify `frontend/src/components/AppLayout.jsx`
- Modify `frontend/src/pages/HomePage.jsx`
- Test `frontend/src/test/App.test.jsx`

- [ ] **Step 1: Add coverage for the real navigation targets**
  - Assert the sign-in trigger is a button, not a span.
  - Assert the order CTA points to `/profile/orders`.
  - Assert the home feature CTAs do not point at unsupported routes like `/learn-more`, `/stories`, or `href="#"`.

```jsx
expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
expect(screen.getByRole('link', { name: /view orders/i })).toHaveAttribute('href', '/profile/orders')
```

- [ ] **Step 2: Replace the non-focusable sign-in trigger**
  - Change the header trigger from `span` to `button type="button"`.
  - Keep the dropdown open on hover and keyboard focus by preserving the existing `:focus-within` behavior.
  - Leave the dropdown content intact; only the trigger semantics change.

- [ ] **Step 3: Remove dead links from the home page**
  - Point the "View orders" CTA to `/profile/orders`.
  - Remove the `/learn-more` and `/stories` links from the video section rather than inventing fake destinations.
  - Remove the two `href="#"` support tiles and keep only the support links that already have honest destinations.

- [ ] **Step 4: Remove unsupported `useCase` links**
  - Keep the home page marketing copy, but stop emitting `/products?useCase=...` links because the catalog does not consume that query param.
  - Use existing routes only, such as `/products`, `/cart`, `/login`, `/register`, or `/profile`.

- [ ] **Step 5: Run the shell tests**
  - Run: `npx vitest run src/test/App.test.jsx`
  - Expected: pass with the updated route and navigation assertions.

### Task 2: Harden auth expiry and public auth requests

**Files:**
- Modify `frontend/src/lib/apiClient.js`
- Modify `frontend/src/components/RequireAuth.jsx`
- Add `frontend/src/test/apiClient.test.js`
- Test `frontend/src/test/App.test.jsx`

- [ ] **Step 1: Add coverage for stale-token behavior**
  - Verify an expired token redirects to `/login` from a protected route.
  - Verify `/auth/*` requests do not receive an `Authorization` header when a token exists.
  - Verify a `401` response clears the stored auth token.

```jsx
expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
```

- [ ] **Step 2: Validate token presence, not just token shape**
  - Use `isTokenValid(token)` in `RequireAuth`.
  - If the token is missing or expired, call `clearAuth()` and redirect to `/login`.
  - Keep the redirect state so users can return after signing in.

- [ ] **Step 3: Stop sending auth headers to public auth endpoints**
  - In `apiClient`’s request interceptor, skip the bearer header for `/auth/login`, `/auth/register`, `/auth/forgot-password`, and `/auth/reset-password`.
  - Keep the bearer header for protected API calls only.
  - If a stored token is invalid, clear it before the request goes out.

- [ ] **Step 4: Clear auth on unauthorized responses**
  - Add a response interceptor that clears the token on `401`.
  - Do not clear auth for non-auth failures such as `404` or `500`.

- [ ] **Step 5: Run the auth tests**
  - Run: `npx vitest run src/test/App.test.jsx src/test/apiClient.test.js`
  - Expected: pass with redirect and interceptor assertions.

### Task 3: Make the catalog and product detail responsive

**Files:**
- Modify `frontend/src/index.css`
- Modify `frontend/src/pages/ProductDetailPage.jsx`
- Modify `frontend/src/components/ProductGrid.jsx`
- Test `frontend/src/test/ProductsPage.test.jsx`
- Test `frontend/src/test/ProductDetailPage.test.jsx`

- [ ] **Step 1: Keep the current product interactions covered**
  - Keep the product browsing and add-to-cart tests passing after the markup/CSS change.
  - Keep the pagination and product detail loading/error tests passing.

- [ ] **Step 2: Make the catalog grid collapse cleanly**
  - Replace the hard-coded four-column grid with responsive `repeat(auto-fit, minmax(...))` or breakpoint-based column counts.
  - Replace the brittle `vw`-sized typography in the catalog filters/cards with `clamp()` values or rem-based sizes.
  - Keep the filter form usable at tablet and phone widths.

- [ ] **Step 3: Remove the fixed-width detail header spacer**
  - Replace the inline `width: '130px'` spacer in `ProductDetailPage.jsx` with a semantic spacer element or a grid layout that does not depend on a magic width.
  - Make the top navigation wrap or stack at smaller widths so the back link and title never overlap.

- [ ] **Step 4: Use the shared currency formatter in the product cards**
  - Swap the inline `new Intl.NumberFormat('vi-VN')...` code for `currencyFormatter` from `frontend/src/lib/formatters.js`.
  - Remove the now-unused import warning in `ProductGrid.jsx`.

- [ ] **Step 5: Run the UI tests and a resize sanity check**
  - Run: `npx vitest run src/test/ProductsPage.test.jsx src/test/ProductDetailPage.test.jsx`
  - Expected: pass with the layout changes in place.
  - Manually verify the browser at desktop, tablet, and mobile widths before closing the task.

### Task 4: Remove lint blockers and finish verification

**Files:**
- Modify `frontend/src/pages/CheckoutPage.jsx`
- Test `frontend/src/test/CheckoutPage.test.jsx`

- [ ] **Step 1: Eliminate the effect-driven address sync**
  - Derive `defaultAddressId` directly from the loaded addresses.
  - Remove the `useEffect` that calls `setSelectedAddressId()` synchronously.
  - Keep the existing `effectiveSelectedAddressId` fallback logic so checkout still works when the user has not clicked a radio button.

- [ ] **Step 2: Confirm checkout behavior still works**
  - Keep the existing `CheckoutPage.test.jsx` coverage for order placement and route navigation.
  - Add or adjust assertions only if the selected-address logic changes the mutation input.

- [ ] **Step 3: Run the full verification set**
  - Run: `npm run lint`
  - Run: `npm run test:run`
  - Run: `npm run build`
  - Expected: all three commands complete successfully.

---

**Execution order**
1. Task 1 and Task 2 first, because they fix broken behavior and auth risk.
2. Task 3 next, because it addresses the UI/UX regressions.
3. Task 4 last, because it is mostly cleanup plus final verification.
