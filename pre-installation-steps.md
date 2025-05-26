# Pre-Installation Steps for Android APK Build

Before you can build the Android APK, make sure you have the following installed on your system:

## Required Software

1. **Node.js and npm**: 
   - Install Node.js 16 or higher
   - Download from: https://nodejs.org/

2. **Android Studio**:
   - Required for building Android apps
   - Download from: https://developer.android.com/studio
   - Make sure to install the Android SDK during setup

3. **Java Development Kit (JDK)**:
   - At least version 11
   - Download from: https://www.oracle.com/java/technologies/javase-jdk11-downloads.html

## Environment Setup

1. **Android SDK**:
   - Open Android Studio → Settings/Preferences
   - Go to Appearance & Behavior → System Settings → Android SDK
   - Install Android SDK Platform 33 (or latest)
   - Install Android SDK Build-Tools

2. **Environment Variables**:
   - Set JAVA_HOME to point to your JDK installation
   - Set ANDROID_HOME to point to your Android SDK location
   - Add platform-tools to your PATH

## For Mac Users

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install JDK
brew install --cask adoptopenjdk11

# Install Android Studio
brew install --cask android-studio
```

After installing Android Studio, open it and follow the setup wizard to install the necessary Android SDK components.

## For Windows Users

1. Install Node.js from the official website
2. Install JDK from Oracle's website
3. Install Android Studio from Google's website
4. Set up environment variables:
   - Right-click This PC → Properties → Advanced system settings → Environment Variables
   - Add JAVA_HOME pointing to your JDK installation
   - Add ANDROID_HOME pointing to your Android SDK location
   - Add platform-tools to PATH

## Project Setup

1. **Extract the project ZIP** to a local directory
2. **Open terminal/command prompt** in the project directory
3. **Install project dependencies**:
   ```bash
   npm install
   ```

## Running the Build Script

After completing all pre-installation steps, you can run the build script:

```bash
./build-android-apk.sh
```

If you encounter permissions issues on Mac/Linux, make the script executable:

```bash
chmod +x ./build-android-apk.sh
```

## Troubleshooting

If you encounter build errors related to missing Android SDK components:
1. Open Android Studio
2. Go to Tools → SDK Manager
3. Install any missing components

For other build errors, make sure all environment variables are set correctly and that you have the necessary permissions to write to the project directory.