# E2E tests (Playwright)

## Running

- **All E2E:** `npm run test:e2e`
- **UI mode:** `npm run test:e2e:ui`
- **With dev server already running:** Playwright will reuse it (`reuseExistingServer: true` when not in CI).

## Auth

The app uses **Google OAuth** only. Current E2E runs **unauthenticated**: we only check that pages load or redirect to `/auth` where appropriate.

To run E2E **as a logged-in user**:

1. Add a **test-only Credentials provider** in `lib/auth.ts` (e.g. only when `process.env.NODE_ENV === 'test'` or `USE_TEST_CREDENTIALS=1`).
2. Add a Playwright **auth setup** that signs in with test credentials and saves storage state to `e2e/.auth/user.json`.
3. Add a **project** in `playwright.config.ts` that uses `storageState: 'e2e/.auth/user.json'` and `dependencies: ['setup']`.

Then you can run authenticated E2E with:

```bash
npx playwright test --project=chromium --project=authenticated
```
