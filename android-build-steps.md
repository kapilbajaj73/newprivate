# Android APK Build Guide for Onra Voice

## Step 1: Build Your Web App

```bash
# Build the web app for production
npm run build
```

## Step 2: Set Up Android Platform

```bash
# Add Android platform (first time only)
npx cap add android

# If you've added Android before, update it
npx cap update android

# Copy web assets to Android
npx cap copy android
```

## Step 3: Open Android Studio

```bash
# Open the Android project in Android Studio
npx cap open android
```

## Step 4: Configure Android Files

### Add Permissions to AndroidManifest.xml

1. In Android Studio, locate and open:
   `app > src > main > AndroidManifest.xml`

2. Add these permissions after the `<manifest>` tag and before the `<application>` tag:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### Add Network Security Config

1. Create XML directory (if it doesn't exist):
   - Right-click on `app > src > main > res`
   - Select New > Directory
   - Name it "xml"
   - Click OK

2. Create network_security_config.xml file:
   - Right-click on the new "xml" folder
   - Select New > File
   - Name it "network_security_config.xml"
   - Copy & paste this content:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">xatubyeifavdpchhfhvd.supabase.co</domain>
    </domain-config>
</network-security-config>
```

3. Update AndroidManifest.xml application tag:
   - Find the `<application>` tag in AndroidManifest.xml
   - Add this attribute to it:
   - `android:networkSecurityConfig="@xml/network_security_config"`

Example:
```xml
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/AppTheme"
    android:networkSecurityConfig="@xml/network_security_config">
    <!-- rest of application content -->
</application>
```

## Step 5: Build the APK

1. In Android Studio:
   - Click Build menu
   - Select Build Bundle(s) / APK(s)
   - Choose Build APK(s)
   - Wait for build to complete

2. Find your APK file:
   - Click "locate" in the notification that appears
   - or find it at: `android/app/build/outputs/apk/debug/app-debug.apk`

## Step 6: Install on Your Device

1. Connect your Android device via USB

2. Enable USB debugging on your device if not already enabled

3. Install APK using Android Studio:
   - Click Run menu
   - Select Run 'app'
   - Select your device

4. Or install using ADB:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

If you encounter connection issues with Supabase:

1. Check if your device has internet access
2. Make sure app has proper permissions
3. Check Android Studio Logcat for detailed error messages

## Next Steps

After successfully building and installing the APK:

1. Test login with admin/admin123
2. Verify conference rooms functionality
3. Test audio recording and playback
4. If everything works correctly, you can create a release version APK