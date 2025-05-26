#!/bin/bash

echo "Building Onra Voice APK..."

# Navigate to the Android project directory
cd android

# Grant execute permission to gradlew
chmod +x gradlew

# Clean the project
./gradlew clean

# Build the APK in debug mode
./gradlew assembleDebug

# Display the path to the built APK
echo "APK built successfully!"
echo "APK location: $(pwd)/app/build/outputs/apk/debug/app-debug.apk"