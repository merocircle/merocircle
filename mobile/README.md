# MeroCircle Mobile

Expo (React Native) app for MeroCircle. Run from repo root: `npm run mobile:start`.

## Logo and icon

- App icon and splash use `assets/images/icon.png` (MeroCircle logo).
- Home screen logo: `assets/images/logo.png` (same logo).

## Dependency vulnerabilities

Many reported vulnerabilities come from:

1. **Transitive dependencies** – e.g. `stream-chat-react` (web app) and other packages pull in older libraries with known CVEs; fixing them often requires upgrading or replacing the parent package.
2. **Monorepo hoisting** – the root `package.json` and `mobile` workspace share `node_modules`; `npm audit` reflects the whole tree.
3. **React version override** – the root app uses React 19; some deps (e.g. `react-image-gallery` inside `stream-chat-react`) still declare support only up to React 18. npm overrides peer deps and reports warnings.

**What you can do:**

- Run `npm audit` to see details.
- Run `npm audit fix` to apply non-breaking fixes (do not use `--force` unless you accept possible breakage).
- Upgrade Node to **≥ 20.19.4** to satisfy the engine requirements of React Native / Metro and reduce EBADENGINE warnings.
