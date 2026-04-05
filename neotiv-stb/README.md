# Neotiv STB Launcher

A lightweight Android TV kiosk app that runs the Neotiv TV Dashboard in a fullscreen WebView with perfect D-pad remote control support.

## Features

- **WebView Kiosk** — Fullscreen, no address bar, no system UI
- **D-pad Bridge** — Intercepts `KEYCODE_DPAD_*` → dispatches clean `KeyboardEvent`s
- **Auto-Boot** — Registers as HOME launcher + BOOT_COMPLETED receiver
- **Setup Screen** — D-pad navigable config form (or headless via ADB)
- **Back Button Blocked** — Maps to Escape (close modals), never exits
- **Intent:// Handler** — Supports Android app launching from dashboard
- **Auto-Retry** — Waits for network after STB boot
- **JS Bridge** — `window.NeotivNative` for device info and remote control

## Prerequisites

1. **Java 17+** installed
   ```bash
   brew install openjdk@17
   ```

2. **Android SDK** — easiest via [Android Studio](https://developer.android.com/studio)
   - Or command-line tools only:
   ```bash
   brew install --cask android-commandlinetools
   sdkmanager "platforms;android-34" "build-tools;34.0.0"
   ```

3. **ADB** in your PATH
   ```bash
   brew install android-platform-tools
   ```

## Quick Start

### Build & Deploy (one command)

```bash
chmod +x deploy.sh

# Auto-configure a specific room:
./deploy.sh 192.168.1.100 amartha-bali 101 https://tv.neotiv.com

# Or just install (manual setup via remote):
./deploy.sh 192.168.1.100
```

### Manual Build

```bash
# Generate Gradle wrapper (first time only)
gradle wrapper --gradle-version 8.5

# Build debug APK
./gradlew assembleDebug

# Build release APK (minified, smaller)
./gradlew assembleRelease
```

The APK will be at:
- Debug: `app/build/outputs/apk/debug/app-debug.apk`
- Release: `app/build/outputs/apk/release/app-release-unsigned.apk`

### Install via ADB

```bash
adb connect 192.168.1.100:5555
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Configuration

### Option A: Setup Screen (via remote)
On first launch, a setup screen appears where staff can enter:
- Server URL
- Hotel Slug
- Room Code

All navigable via D-pad remote control.

### Option B: Headless via ADB (for bulk deployment)
```bash
adb shell am start -n com.neotiv.stb/.SetupActivity \
  --es base_url "https://tv.neotiv.com" \
  --es hotel_slug "amartha-bali" \
  --es room_code "101"
```

### Option C: Reconfigure from Dashboard
Your Next.js app can call:
```javascript
// Trigger setup screen from JS
if (window.NeotivNative) {
  window.NeotivNative.reconfigure();
}
```

## JS Bridge API

The app exposes `window.NeotivNative` in the WebView:

```javascript
// Get device info
const info = JSON.parse(window.NeotivNative.getDeviceInfo());
// → { model: "B860H", manufacturer: "ZTE", android: "9", sdk: 28 }

// Open setup screen
window.NeotivNative.reconfigure();

// Force reload
window.NeotivNative.reloadDashboard();
```

## How D-pad Mapping Works

| Remote Button | Android KeyCode | → JS KeyboardEvent |
|---|---|---|
| ↑ | `KEYCODE_DPAD_UP` (19) | `ArrowUp` |
| ↓ | `KEYCODE_DPAD_DOWN` (20) | `ArrowDown` |
| ← | `KEYCODE_DPAD_LEFT` (21) | `ArrowLeft` |
| → | `KEYCODE_DPAD_RIGHT` (22) | `ArrowRight` |
| OK/Center | `KEYCODE_DPAD_CENTER` (23) | `Enter` |
| Back | `KEYCODE_BACK` (4) | `Escape` |
| 0-9 | `KEYCODE_0` - `KEYCODE_9` | `0` - `9` |
| Delete | `KEYCODE_DEL` (67) | `Backspace` |

This bridges directly into your existing `useDpadNavigation` hook — no changes needed to the web app.

## Bulk Deployment Script

For deploying to many STBs at once, create a `rooms.csv`:

```csv
192.168.1.101,amartha-bali,101
192.168.1.102,amartha-bali,102
192.168.1.103,amartha-bali,201
```

Then run:
```bash
while IFS=, read -r ip slug room; do
  echo "Deploying to Room $room ($ip)..."
  ./deploy.sh "$ip" "$slug" "$room" "https://tv.neotiv.com"
done < rooms.csv
```

## Troubleshooting

### STB won't connect via ADB
```bash
# Enable developer options: Settings > About > tap Build Number 7 times
# Enable USB debugging: Settings > Developer Options > USB Debugging
# Enable ADB over network: Settings > Developer Options > ADB over network
```

### WebView shows blank page
```bash
# Check Android WebView version
adb shell dumpsys package com.google.android.webview | grep versionName

# Update WebView (if Play Store available)
adb shell am start -a android.intent.action.VIEW -d "market://details?id=com.google.android.webview"
```

### Reset configuration
```bash
adb shell pm clear com.neotiv.stb
```

## Project Structure

```
neotiv-stb/
├── app/src/main/
│   ├── AndroidManifest.xml      # Launcher + boot receiver declarations
│   ├── java/com/neotiv/stb/
│   │   ├── MainActivity.kt      # WebView kiosk + D-pad bridge
│   │   ├── SetupActivity.kt     # First-run config screen
│   │   └── BootReceiver.kt      # Auto-start on power on
│   └── res/
│       └── values/
│           ├── strings.xml
│           └── styles.xml
├── deploy.sh                    # One-command build & deploy
├── build.gradle.kts             # Project-level Gradle config
└── app/build.gradle.kts         # App-level dependencies
```
