# Onra Voice APK Build Instructions

This document provides instructions for building the Onra Voice Android APK from the source code.

## Option 1: Build in Android Studio (Recommended)

1. Clone/download the repository to your local machine
2. Open a terminal and navigate to the project root directory
3. Run the following commands:

```bash
# Install dependencies
npm install

# Build the web application
npm run build

# Sync Capacitor with Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

4. In Android Studio:
   - Wait for the project to load and sync
   - Click on "Build" in the top menu
   - Select "Build Bundle(s) / APK(s)" -> "Build APK(s)"
   - Wait for the build to complete
   - Click on the notification "APK(s) generated successfully..." and select "locate" to find the APK file

5. The APK will be located at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

## Option 2: Build from Command Line

If you prefer to build from the command line:

1. Make sure you have the Android SDK and Java JDK installed
2. Set up ANDROID_HOME and JAVA_HOME environment variables
3. Run the following commands:

```bash
# Install dependencies
npm install

# Build the web application
npm run build

# Sync Capacitor with Android
npx cap sync android

# Build the APK
./build-apk.sh
```

4. The APK will be located at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

## Default Login Credentials

The app uses in-memory storage with the following default login credentials:

- Admin User:
  - Username: admin
  - Password: admin123

- Regular User:
  - Username: user
  - Password: User@123

## Features

This standalone APK includes:
- In-memory storage for offline usage
- Local audio recording capabilities
- Walkie-talkie style conference rooms
- Isolated audio channels
- Pre-configured demo users and rooms

## Troubleshooting

If you encounter any issues:

1. Make sure Android SDK is properly installed
2. Check that the minimum SDK version is supported by your device
3. Enable USB debugging on your device
4. For more details, review the Android build logs in Android Studio