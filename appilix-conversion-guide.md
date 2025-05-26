# Converting Onra Voice to Android APK using Appilix

This guide explains how to convert the Onra Voice web application to an Android APK using Appilix without any coding.

## What is Appilix?

[Appilix](https://appilix.com/) is a service that converts websites into mobile apps without requiring any coding. It offers features like:

- Firebase Push Notifications
- Biometric Authentication
- Navigation Drawer Menus
- Deep Link Integration
- Customizable Splash Screen

## Steps to Convert Onra Voice Web App to APK

### Step 1: Deploy Your Web Application

Before using Appilix, you need to deploy your Onra Voice web application:

1. Click the "Deploy" button in your Replit project
2. Wait for the deployment to complete
3. Note down the deployed URL (e.g., `https://your-app-name.replit.app`)

### Step 2: Create an Appilix Account

1. Go to [Appilix.com](https://appilix.com/)
2. Sign up for an account (or log in if you already have one)
3. Choose a plan that suits your needs

### Step 3: Convert Your Website to an App

1. After logging in, locate the website conversion tool
2. Enter your deployed web application URL (e.g., `https://your-app-name.replit.app`)
3. Click "Convert to App"

### Step 4: Customize Your App

Appilix will provide customization options:

1. **App Information**:
   - App Name: "Onra Voice"
   - Package Name: Use a reverse domain name (e.g., `com.yourdomain.onravoice`)
   - Version Name and Code

2. **Appearance**:
   - Upload your app icon (use your Onra Voice logo)
   - Set theme colors to match your app's color scheme (#1A1F2C, #0EA5E9, #8B5CF6)
   - Configure splash screen

3. **Features**:
   - Enable Firebase Push Notifications if needed
   - Set up Biometric Authentication for added security
   - Configure Navigation Drawer Menu for easy access to different sections
   - Add Deep Link Integration for direct access to specific parts of your app

### Step 5: Configure Android Permissions

Ensure these important permissions are enabled:

1. Internet Access (required for web app functionality)
2. Microphone Access (required for audio conferencing)
3. Storage Access (optional, for recording storage)

### Step 6: Build Your APK

1. Once you've configured all settings, click "Build App"
2. Wait for Appilix to process your request and build the APK
3. Download the generated APK when ready

### Step 7: Test Your App

1. Install the APK on your Android device
2. Test all functionality, especially:
   - Audio conferencing
   - User authentication
   - Room creation and joining
   - Audio recording

### Step 8: Publish Your App (Optional)

If you want to publish your app to the Google Play Store:

1. Create a Google Play Developer account if you don't have one
2. Follow Google Play's guidelines for publishing apps
3. Submit your APK for review

## Important Considerations

1. **In-Memory Mode**: The APK will work in in-memory mode by default, meaning all data is stored locally and reset when the app is closed.

2. **Server Connection**: If you want the app to connect to your server for persistent data:
   - Configure the app to connect to your deployed Replit app
   - Make sure your database is properly set up
   - Ensure proper security measures are in place

3. **WebView Limitations**: Since Appilix uses WebView to display your web app, some advanced WebRTC features might have limitations. Test thoroughly to ensure all features work as expected.

4. **App Performance**: Web-to-app conversions may not perform as well as native apps. Optimize your web app for mobile devices to ensure the best performance.

## Troubleshooting

If you encounter issues with your converted app:

1. **WebView Errors**: Make sure your web app is fully responsive and works well on mobile browsers
2. **Microphone Access**: Verify that your app properly requests microphone permissions
3. **Connection Issues**: Check that your app can properly connect to the server if using server mode
4. **Caching Problems**: Implement proper cache control in your web app to avoid stale content

## Support

For issues with the conversion process, contact Appilix support. For issues with your Onra Voice app functionality, refer to the app's documentation.