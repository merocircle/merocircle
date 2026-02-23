# MeroCircle Mobile

Expo (React Native) app for MeroCircle. Run from repo root: `npm run mobile:start`.

## Auth (Phase 3)

The **mobile app uses Supabase Auth** (Google OAuth via Supabase). The **web app uses NextAuth + Google**. Both are safe to use together — they share the same Supabase project and `public.users` table.

- Copy `mobile/.env.example` to `mobile/.env` and set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (same as the web app).

### One-time Supabase setup

1. **Authentication → Providers** — enable **Google** and enter your Google OAuth **Web Client ID** and **Secret** (same as NextAuth).
2. **Authentication → URL Configuration → Redirect URLs** — add exactly:
   ```
   mobile://auth/callback
   ```
   This is a fixed URL that never changes. Works in both **Expo Go** and dev/standalone builds. The in-app browser (`ASWebAuthenticationSession` on iOS, Chrome Custom Tabs on Android) intercepts the custom scheme and returns the URL to the app without needing the scheme to be registered. **If sign-in keeps redirecting to `localhost`, this URL is missing from the list.**

No Google Cloud Console redirect URI changes are needed for the mobile flow.

## Distribution (APK / iOS testing)

To build an **Android APK** for testers or an **iOS** build (simulator or TestFlight), see **[DISTRIBUTION.md](./DISTRIBUTION.md)**. You need an Expo account and EAS CLI; from repo root you can run `npm run mobile:build:android` or `npm run mobile:build:ios`.

## Logo and icon

- App icon and splash use `assets/images/icon.png` (MeroCircle logo).
- Home screen logo: `assets/images/logo.png` (same logo).

## Dependency vulnerabilities

Many reported vulnerabilities come from:

1. **Transitive dependencies** — e.g. `stream-chat-react` (web app) and other packages pull in older libraries with known CVEs.
2. **Monorepo hoisting** — the root `package.json` and `mobile` workspace share `node_modules`; `npm audit` reflects the whole tree.
3. **React version override** — the root app uses React 19; some deps still declare support only up to React 18.

Run `npm audit` to see details and `npm audit fix` to apply non-breaking fixes.
