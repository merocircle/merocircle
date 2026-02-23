# Distributing MeroCircle for testing

This guide covers building and sharing the app for testers **before Phase 3** (no auth/backend required).

## Prerequisites

1. **Expo account** (free): [expo.dev](https://expo.dev) — sign up if needed.
2. **EAS CLI** (one-time install):
   ```bash
   npm install -g eas-cli
   ```
3. **Run commands from the `mobile` folder** (where `app.json` and `eas.json` live):
   ```bash
   cd mobile
   ```
   Or from repo root using the workspace:
   ```bash
   npm run mobile:start   # already works from root
   cd mobile && npm run build:android
   ```

## First-time setup

From the `mobile` directory:

```bash
eas login
eas build:configure
```

`eas build:configure` is optional; this project already has `eas.json`. You only need to log in.

---

## Android — APK for testers worldwide

Build an **APK** that anyone can install (no Play Store needed).

1. **Start a build**
   ```bash
   cd mobile
   npm run build:android
   ```
   Or: `eas build --platform android --profile preview`

2. **Wait for the build** on [expo.dev](https://expo.dev) (Builds tab). You’ll get an email when it’s done.

3. **Get the APK**
   - Open the build page on expo.dev.
   - Use **Download** to get the `.apk` file.

4. **Share with testers**
   - Upload the APK to Google Drive, Dropbox, Firebase App Distribution, or your own server.
   - Send the link to testers.
   - They open the link on their Android device, download the APK, and install (they may need to allow “Install from unknown sources” in settings).

---

## iOS — testing options

### Option A: Simulator build (no Apple Developer account)

Good for testers who have a **Mac with Xcode**.

1. **Build**
   ```bash
   cd mobile
   npm run build:ios
   ```
   This uses the **preview** profile and produces an **iOS Simulator** build (`.app` or `.tar.gz`).

2. **Share**
   - Download the build from the EAS build page.
   - Testers unzip and drag the `.app` into the iOS Simulator (Xcode → Open Developer Tool → Simulator), or install via CLI.

**Limitation:** Only runs in the Simulator on a Mac, not on real iPhones.

### Option B: TestFlight (real iPhones, worldwide)

For testers to install on **real iPhones** (anywhere in the world), use **TestFlight**. This requires:

- **Apple Developer Program** ($99/year): [developer.apple.com](https://developer.apple.com).

Steps (after you have an Apple Developer account):

1. **Configure EAS for Apple**
   ```bash
   cd mobile
   eas credentials
   ```
   Follow prompts to set up Apple credentials (or let EAS manage them).

2. **Build for TestFlight**
   Use the **production** profile (no `simulator`), so the build is suitable for App Store Connect / TestFlight:
   ```bash
   npm run build:ios:prod
   ```
   Or: `eas build --platform ios --profile production`

3. **Submit to TestFlight** (when the build is done)
   ```bash
   eas submit --platform ios --profile production
   ```
   Then in [App Store Connect](https://appstoreconnect.apple.com) add testers (by email) or enable public link. They install the **TestFlight** app and open your build from there.

---

## Build profiles (reference)

| Profile     | Android      | iOS                    | Use case                          |
|------------|--------------|------------------------|-----------------------------------|
| **preview**  | APK (direct install) | Simulator build        | Internal testing, share APK / Mac simulator |
| **production** | AAB (Play Store) | Device build (IPA)     | Play Store, TestFlight, App Store |

---

## Quick reference

- **Android APK (share link):**  
  `cd mobile && npm run build:android` → download APK from expo.dev → upload and share link.

- **iOS Simulator (Mac testers):**  
  `cd mobile && npm run build:ios` → share the downloaded simulator build.

- **iOS real devices (worldwide):**  
  Apple Developer account → `npm run build:ios:prod` → submit to TestFlight → invite testers.

- **Run dev app from repo root:**  
  `npm run mobile:start` then press `a` (Android) or `i` (iOS).
