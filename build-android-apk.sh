#!/bin/bash

# Exit on error
set -e

echo "======================================="
echo "  Building Android APK for Onra Voice  "
echo "======================================="

# Check if npm packages are installed and install required ones if needed
echo "Checking dependencies..."
if ! command -v vite &> /dev/null; then
  echo "Installing necessary packages..."
  npm install
fi

# Additional Capacitor dependencies
echo "Installing Capacitor dependencies..."
npm install @capacitor/core @capacitor/cli @capacitor/android

# Build the web app
echo "Step 1: Building web app..."
echo "Running npm build command..."
# Use npx to ensure we use the local vite installation
npx vite build

# Verify the build output
if [ ! -f "./dist/public/index.html" ]; then
  echo "ERROR: Build output is not as expected."
  echo "Checking contents of dist directory:"
  ls -la ./dist
  
  echo "Trying to fix build output structure..."
  if [ -f "./dist/index.html" ]; then
    # Create the expected public directory and move files
    mkdir -p ./dist/public
    mv ./dist/index.html ./dist/public/
    mv ./dist/assets ./dist/public/
    echo "Restructured build output."
  else
    echo "ERROR: Could not find index.html anywhere in the build output."
    exit 1
  fi
fi

# Clean up existing Android platform if it exists and has errors
if [ -d "./android" ]; then
  echo "Removing existing Android platform to ensure clean setup..."
  rm -rf ./android
fi

# Set up Android platform
echo "Step 2: Setting up Android platform..."
npx cap add android

# Copy web assets to Android
echo "Copying web assets to Android..."
npx cap copy android

# Verify the Android setup
if [ ! -d "./android/app/src/main/assets" ]; then
  echo "Creating Android assets directory..."
  mkdir -p ./android/app/src/main/assets
fi

echo "======================================="
echo "Android project is ready!"
echo ""
echo "Next steps:"
echo "1. Run: npx cap open android"
echo "2. In Android Studio, follow the instructions in android-build-steps.md"
echo "3. Build the APK from Android Studio"
echo "======================================="