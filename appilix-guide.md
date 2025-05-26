# Creating a WebView APK with Appilix

Appilix is a web service that allows you to create Android APKs from your web applications without coding. This is a simpler alternative to the custom WebView approach.

## Quick Guide for Creating an APK with Appilix

1. **Go to Appilix.com**
   - Open your browser and navigate to [https://www.appilix.com](https://www.appilix.com)

2. **Create an Account or Log In**
   - You'll need to register or log in to use their services

3. **Create a New App**
   - Click on "Create New App" 
   - Enter "Onra Voice" as the App Name
   - Enter a brief description like "Secure Virtual Conference Application"

4. **Enter Your Replit URL**
   - When prompted for the URL, enter: `https://secure-conference-1-kapilbajaj730.replit.app/`
   - This is the URL that the app will load when launched

5. **Configure App Settings**
   - **App Icon**: Upload a custom icon for your app (512x512 PNG recommended)
   - **Color Scheme**: Choose colors that match your app's theme (#1A1F2C and #0EA5E9)
   - **Permissions**: Make sure to enable:
     - Internet access
     - Microphone access
     - Audio settings modification

6. **Advanced Settings (Important)**
   - Enable "Allow JavaScript"
   - Enable "Allow DOM Storage"
   - Enable "Media playback doesn't require user gesture" (for audio calls)
   - In Custom JavaScript section, add: `localStorage.setItem('USE_MEMORY_STORAGE', 'true');` to force in-memory storage mode

7. **Build the APK**
   - Click on "Build APK" or "Generate APK" button
   - Wait for the build process to complete (this might take a few minutes)

8. **Download and Install**
   - Once the build is complete, download the APK file
   - Transfer it to your Android device
   - Install the APK by opening the file on your device
   - You may need to enable "Install from Unknown Sources" in your device settings

## Advantages of Using Appilix

- No coding required
- No need for Android Studio
- Quick and simple process
- Automatic updates when your web app changes (if you enable this option)

## Limitations

- Less customization than building the APK yourself
- May include Appilix branding in free versions
- Limited advanced features compared to native apps

## Note on Production Use

For production-level applications, consider either:
1. Using the custom WebView approach (build-webview-apk.sh script)
2. Upgrading to Appilix Pro for more features
3. Investing in the full Capacitor approach for a truly native experience