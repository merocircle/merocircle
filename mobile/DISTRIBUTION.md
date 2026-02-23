# Distributing / testing MeroCircle on Android & iOS

## Prerequisites

1. **Expo account** (free): [expo.dev](https://expo.dev)
2. **EAS CLI** (one-time install):
   ```bash
   npm install -g eas-cli
   eas login
   ```
3. **Run commands from the `mobile` folder** (where `app.json` and `eas.json` live):
   ```bash
   cd mobile
   ```

---

## Android — Development Build (recommended for testing auth / dev work)

Expo Go on Android **cannot** intercept `mobile://auth/callback` from Chrome Custom Tabs — that's a
system-level difference from iOS. A **development build** is the fix: it's exactly like Expo Go
(hot-reload, shake menu, dev server connection) but it has your app's `mobile://` scheme registered
so the OAuth redirect returns to the right app.

### 1. Build it (cloud, ~10–15 min)

```bash
cd mobile
npm run build:android:dev
# same as: eas build --platform android --profile development
```

Download the `.apk` from [expo.dev/builds](https://expo.dev) when it finishes.

### 2. Install it on the device

Transfer the APK to the device and install (allow "Install from unknown sources" if asked).
You now have a **MeroCircle dev build** app — keep Expo Go installed if you still want it for other projects.

### 3. Start your dev server

```bash
# from repo root
npm run mobile:start
# or: cd mobile && npx expo start
```

### 4. Open the dev build and connect

- Open **MeroCircle** (the dev build, not Expo Go) on your Android device.
- It will show an Expo dev client screen — enter your machine's IP:port or scan the QR code from the terminal.
- From here, development works exactly like Expo Go: save a file, the app reloads.

> **Why not `npx expo run:android`?**  
> That also creates a dev build but requires Android Studio and an attached device/emulator.
> `eas build` is faster and needs no local Android toolchain.

---

## Android — Preview APK (share with testers, no dev server needed)

This is a **standalone APK** — no Expo dev client, no hot-reload. Good for sharing with testers
who just want to install and use the app.

```bash
cd mobile
npm run build:android
# same as: eas build --platform android --profile preview
```

Download APK → share link → testers install directly.

---

## iOS — options

### Simulator build (Mac testers, no Apple account)

```bash
cd mobile
npm run build:ios
# same as: eas build --platform ios --profile preview
```

Download the `.tar.gz`, unzip, drag the `.app` into the iOS Simulator.

### TestFlight (real iPhones, worldwide)

Requires **Apple Developer Program** ($99/year).

```bash
eas credentials          # set up Apple signing (one-time)
npm run build:ios:prod   # eas build --platform ios --profile production
eas submit --platform ios --profile production
```

Then add testers in [App Store Connect](https://appstoreconnect.apple.com).

---

## Build profiles reference

| Profile | Android | iOS | Use case |
|---------|---------|-----|----------|
| **development** | APK + dev client | – | **Auth + feature testing on Android devices** |
| **preview** | APK (standalone) | Simulator `.app` | Share with external testers |
| **production** | AAB (Play Store) | IPA (TestFlight/App Store) | Public release |

---

## Quick commands

```bash
# Android dev build (auth works, hot-reload, connect to dev server)
cd mobile && npm run build:android:dev

# Android APK for testers
cd mobile && npm run build:android

# iOS simulator (Mac only)
cd mobile && npm run build:ios

# Start dev server (connect from dev build or Expo Go)
npm run mobile:start          # from repo root
```
