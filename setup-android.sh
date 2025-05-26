#!/bin/bash

# Onra Voice - Android Build Setup Script
# This script automates the setup and build process for the Android APK

echo "=== Onra Voice Android Setup ==="
echo "This script will prepare the project for Android APK generation"

# Step 1: Install dependencies
echo -e "\n\n=== Installing dependencies ==="
npm install

# Step 2: Build the production web app
echo -e "\n\n=== Building web application ==="
npm run build

# Step 3: Ensure Capacitor is installed
echo -e "\n\n=== Setting up Capacitor ==="
if [ ! -d "android" ]; then
  echo "Adding Android platform..."
  npx cap add android
else
  echo "Android platform already exists, updating..."
  npx cap update android
fi

# Step 4: Copy web assets to Android
echo -e "\n\n=== Copying web assets to Android ==="
npx cap copy android

# Step 5: Update Android manifest permissions
echo -e "\n\n=== Updating Android permissions ==="
MANIFEST_FILE="android/app/src/main/AndroidManifest.xml"

# Check if the permissions are already added
if ! grep -q "RECORD_AUDIO" "$MANIFEST_FILE"; then
  echo "Adding audio permissions to AndroidManifest.xml"
  sed -i '/<uses-permission android:name="android.permission.INTERNET">/a \
    <uses-permission android:name="android.permission.RECORD_AUDIO" />\
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />\
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />\
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />\
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />' "$MANIFEST_FILE"
else
  echo "Android permissions already configured"
fi

# Step 6: Generate debug APK
echo -e "\n\n=== Build options ==="
echo "1. Open in Android Studio (recommended for first build)"
echo "2. Generate debug APK (requires Android SDK tools in PATH)"
echo "3. Exit"
read -p "Select an option: " option

case $option in
  1)
    echo "Opening project in Android Studio..."
    npx cap open android
    ;;
  2)
    echo "Generating debug APK..."
    cd android
    ./gradlew assembleDebug
    echo "Debug APK generated at: android/app/build/outputs/apk/debug/app-debug.apk"
    ;;
  3)
    echo "Exiting setup"
    ;;
  *)
    echo "Invalid option, exiting"
    ;;
esac

echo -e "\n\n=== Setup completed ==="
echo "To manually build the APK, open the project in Android Studio with: npx cap open android"
echo "Then use Build > Build Bundle(s) / APK(s) > Build APK(s)"