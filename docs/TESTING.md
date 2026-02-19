# Running Tests

This project uses **Vitest** for unit and integration tests and **Playwright** for end-to-end (E2E) tests. All tests run on every push and pull request via GitHub Actions.

---

## Quick reference

| What | Command |
|------|---------|
| Run all unit + integration tests once | `npm test` or `npm run test -- --run` |
| Run tests in watch mode (re-run on file changes) | `npm run test:watch` |
| Run tests with coverage report | `npm run test:coverage` |
| Run all E2E tests | `npm run test:e2e` |
| Run E2E with UI (debug mode) | `npm run test:e2e:ui` |

For full local commands and examples, see [Run tests locally](#run-tests-locally) at the end of this doc.

---

## Unit and integration tests (Vitest)

Tests live under `__tests__/` and use:

- **Vitest** – test runner
- **React Testing Library** – component tests
- **MSW (Mock Service Worker)** – API and Supabase mocking
- **happy-dom** – browser-like environment

### Commands

```bash
# Run once (CI-style)
npm test
# or
npm run test -- --run

# Watch mode: re-runs when files change
npm run test:watch

# Coverage report (terminal + lcov)
npm run test:coverage
```

### What is tested

- **Unit:** UI components (Button, Input, PostCard, NavIcon), hooks (e.g. `useDebounce`), and utilities (`lib/utils`).
- **Integration (API contract):** `__tests__/integration/api/*.test.ts` – `fetch` to app API routes is mocked by MSW; tests assert response shape (e.g. `/api/dashboard/unified-feed`, `/api/notifications`). This checks what the **client** expects from the API.
- **Integration (backend / API routes):** `__tests__/integration/api-routes/*.test.ts` – the **real** Next.js API route handlers are invoked (GET/POST from `app/api/.../route.ts`) with mocked Supabase and auth. This tests the **server-side** logic (status codes, response body, auth). Currently: `GET /api/posts`, `GET /api/notifications`; more routes can be added the same way.

### Auth in tests

`next-auth/react` is mocked. To test as a logged-in user:

```ts
import { setMockSession, defaultMockSession } from '@/__tests__/utils/auth'
import { withAllProviders } from '@/__tests__/utils/test-wrappers'

setMockSession(defaultMockSession)
render(withAllProviders(<YourComponent />))
```

Session is cleared after each test. See `__tests__/unit/components/AuthAwareExample.test.tsx` for a full example.

---

## E2E tests (Playwright)

E2E tests live in `e2e/` and run in a real browser against the running app.

### Commands

```bash
# Run all E2E tests (starts dev server if needed)
npm run test:e2e

# Run with Playwright UI (pick tests, watch, debug)
npm run test:e2e:ui
```

### Requirements

- The app must be reachable at **http://localhost:3000**.
- If nothing is listening on 3000, Playwright starts `npm run dev` automatically (when not reusing an existing server).
- If you already have `npm run dev` running, Playwright will use it.

### What is tested

- **All pages:** `e2e/all-pages.spec.ts` – one smoke test per route (landing, about, auth, explore, creator/[slug], [username], home, profile, settings, notifications, chat, creator-studio, create-post, admin, payment success/failure/dodo, unsubscribe).
- **Auth flow:** Auth page, “Continue with Google”, landing when not logged in.
- **Protected routes:** Home, settings, etc. – tests assert the page loads or redirects to auth.

E2E runs **unauthenticated** (Google OAuth only; no test credentials). To add authenticated E2E later, see `e2e/README.md`.

---

## CI (GitHub Actions)

- **Workflow:** `.github/workflows/test.yml`
- **On:** every **push** to `main` and every **pull request** targeting `main`.

**Jobs:**

1. **Vitest** – `npm run test -- --run`. Must pass before E2E runs.
2. **Playwright E2E** – `npm run test:e2e` (Chromium + mobile Safari). Runs only after Vitest succeeds.

Merge is effectively blocked if either job fails.

---

## Test layout

```
__tests__/
  setup.ts           # jest-dom, MSW server, next-auth mock
  mocks/
    handlers.ts      # MSW handlers (API + Supabase)
    server.ts        # MSW server for Node
    supabase-server.ts # Mock Supabase client for API route tests
  utils/
    auth.ts          # setMockSession, defaultMockSession
    test-wrappers.tsx # withAllProviders, renderWithAuth
  unit/              # Component and hook tests
  integration/
    api/             # API contract tests (MSW intercepts fetch)
    api-routes/      # Backend tests (invoke real route handlers with mocks)

e2e/
  all-pages.spec.ts  # Smoke test for every route
  auth.spec.ts
  home.spec.ts
  explore.spec.ts
  creator-studio.spec.ts
  payments.spec.ts
  settings.spec.ts
  README.md          # E2E auth and setup notes
```

---

## Run tests locally

Use these commands on your machine. No CI required.

### Unit + integration (Vitest)

```bash
# Run all unit and integration tests once (same as CI)
npm test

# Same, explicit run mode
npm run test -- --run

# Watch mode: re-runs when you change files
npm run test:watch

# With coverage report (terminal + lcov in coverage/)
npm run test:coverage
```

### E2E (Playwright)

```bash
# Run all E2E tests
# Starts the dev server automatically if nothing is on http://localhost:3000
npm run test:e2e

# E2E with UI: pick tests, watch, step through
npm run test:e2e:ui
```

**Tip:** If you already have `npm run dev` running, E2E will reuse that server. Otherwise Playwright starts it for you.

### Run a subset of tests

```bash
# Only Vitest tests in a file or directory
npm run test -- --run __tests__/unit/components/Button.test.tsx
npm run test -- --run __tests__/integration/api-routes

# Only E2E tests in a file or by name
npm run test:e2e e2e/auth.spec.ts
npm run test:e2e -- -g "auth page"
```

---

## Troubleshooting

- **Vitest:** “Missing Supabase environment variables” – Vitest sets `NEXT_PUBLIC_SUPABASE_*` in config; real calls are mocked by MSW. If you see this, ensure `vitest.config.mts` is used and not an old config.
- **Playwright:** “localhost:3000 is already used” – Either stop the other process on 3000 or rely on `reuseExistingServer` (Playwright will try to reuse an existing server when not in CI).
- **E2E timeouts:** Increase `timeout` in the test or in `playwright.config.ts` if the app is slow to load.

---

## Commands to run tests locally (summary)

```bash
npm test                    # Unit + integration (Vitest), run once
npm run test:watch          # Vitest in watch mode
npm run test:coverage       # Vitest with coverage
npm run test:e2e            # E2E (Playwright); starts dev server if needed
npm run test:e2e:ui         # E2E with Playwright UI
```
