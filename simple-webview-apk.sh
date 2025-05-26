#!/bin/bash

# Simple WebView APK Generator
# This script creates a basic Android WebView app that loads your Replit URL

# Set your app details here
APP_NAME="OnraVoice"
PACKAGE_NAME="com.onravoice.app"
WEB_URL="https://secure-conference-1-kapilbajaj730.replit.app/"

echo "Creating simple WebView APK for $WEB_URL"
echo "----------------------------------------"

# Create a temporary directory for the project
mkdir -p simple-apk-project/app/src/main/java/com/onravoice/app
mkdir -p simple-apk-project/app/src/main/res/layout
mkdir -p simple-apk-project/app/src/main/res/values
mkdir -p simple-apk-project/app/src/main/res/xml
mkdir -p simple-apk-project/app/src/main/res/mipmap-hdpi
mkdir -p simple-apk-project/app/src/main/res/mipmap-mdpi
mkdir -p simple-apk-project/app/src/main/res/mipmap-xhdpi
mkdir -p simple-apk-project/app/src/main/res/mipmap-xxhdpi
mkdir -p simple-apk-project/app/src/main/res/mipmap-xxxhdpi
mkdir -p simple-apk-project/gradle/wrapper

cd simple-apk-project

# Create MainActivity.java
cat > app/src/main/java/com/onravoice/app/MainActivity.java << EOF
package $PACKAGE_NAME;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        webView = findViewById(R.id.webView);
        
        // Enable JavaScript and other settings
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // Stay within the app when clicking links
        webView.setWebViewClient(new WebViewClient());
        
        // Handle audio permission requests
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }
        });
        
        // Load your Replit URL
        webView.loadUrl("$WEB_URL");
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
EOF

# Create activity_main.xml
cat > app/src/main/res/layout/activity_main.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</RelativeLayout>
EOF

# Create strings.xml
cat > app/src/main/res/values/strings.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">$APP_NAME</string>
</resources>
EOF

# Create network_security_config.xml for HTTPS connections
cat > app/src/main/res/xml/network_security_config.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>
EOF

# Create AndroidManifest.xml
cat > app/src/main/AndroidManifest.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="$PACKAGE_NAME">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:networkSecurityConfig="@xml/network_security_config"
        android:theme="@android:style/Theme.NoTitleBar">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# Create simple blue icon (base64 encoded png)
cat > icon.base64 << EOF
iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAE
d0lEQVR4nO2dTYhcRRTH/zPZiZuNa1azWbOJRCPBjxAJGtSLm8QvzCoIAT+QB4IJiOJBYbyoBw+C
oAcvevAgEhBEEF008iaKxrhZNDEaXTWfZrPOdmd7ZndiT6fd07Ppftfp91Zff2+aaTr1++v3qrq6
upoIAAAAAAAAAAAAAACgvmChv8U3LPsRAN5rcLv8Q0+Tf+Tt7nDZhICJ1wCMoJnpG/e8gQS4+AqA
URVkdw/SHT8S0s1dTwL5d5oZ3XnAeReTGnAyAPZgOGc3n1y8wXTK9QUEABIQPxBQIiDAnIAAcwIC
zAkIMCcgwJyAAHMCApL/tOulp8n3dQPNhFz0yK2eMx4CpDt5YrwRaA67e07eW2U8VkEBBATkBASY
ExBgTkCAOQEB5gQEmBMQYE5AgDkBAeYEBJgTEGBOQIA5AQHmBASYExBgTkCAOQEB5gQEmBMQYE5A
gDkBAeYEBJgTEGBOQIA5AQHmBASYExBgTkCAOQEB5gQEXCH0vKAkTH8P7KOvQX7/A9Jpwec8e3dC
bn4X3N2Dp+7OlvLKs+Lq1Z5cUF+X4Kc/QL77GLi4xKrPK9APP4U8eh3woKlTK+MAAZZ08YJNvJbR
c5kVlfDq3wN9/C3ggZFQD5OdT4ycINx9c49qFwDovDnw8PdAK9iEA8CCQeju5zt4wnqbjD76DdDa
DrLfxz4CZMdDMtxUaPMASCc0/OzdGeTJxT4C9ORxj3TKdauSHu0QbELZu9PbMyt8BGxuKU5xVJLW
oBKyc9h7JKRv/+ElDXwEzF9jvABYwJk5qB+/BfX6K5CTJ7y/no+ARBouYG20/jL0w0/Bv32VHZN5
f62XCdZKZDNR6JBOQd/50J5iFuAzmWX5EfqLF4FFl+Hv3+wxIoKmgNtZP5rNfSbYh4aYCH38eKEb
F/K9QJgNQiVWQ75PxF1RHuDqC3jkvGa7p0Jy3ByNywEoEBCgUQpIAeULjk+A7hgB9h2CnDkNfdPj
cYcCl3dgHngBes29kCMfgjIZ80ooaQOAXV1Ifz4L7ByOvzXQzmz5bQhqDQE2NYDdPcSJjTzKXE4C
Yk+zTGSRRp9SLRMQUCIgIPcLCKgIBGTgFxBQEQjI/QICKgIBGfgFBFQEAjKnLu9YPCOIx3xMxMUT
CbXqJQlL+JiXAB5d5jXKWwEICCjAmYCAVgACCnAmIKAVgIACnAkIaAUgoABnAgJaAQgowJmAgFYA
AgpwJvDnkNIUYpDz3lUCAkpAwhTuNRAQkAuAgGoEBORVEBBQjYCA/N/KjPIdMdz/BdjqS/Vdg47+
CHnoc/DUz6Dz59QNwkZXAoMDwPpN0KnL0EMfZPZfoRuUixP1nWCu7RSXk13A/KL+nmh5vu5zVIIF
sP2G+p8EfuZp6OZ78nAKZW8Tb7pRKeCmG+t+DL4e0KHNV2e5Z5i76M/jIcAHTY+cRKi7dyXg9I6z
KrLBhB45iQ3X9Ej2t1wv5G+9AgAAAAAAAAAAAAAAAGKEiP4Ddp+6uUYB9kkAAAAASUVORK5CYII=
EOF

# Decode icon to PNG format
base64 -d icon.base64 > app/src/main/res/mipmap-hdpi/ic_launcher.png
cp app/src/main/res/mipmap-hdpi/ic_launcher.png app/src/main/res/mipmap-mdpi/ic_launcher.png
cp app/src/main/res/mipmap-hdpi/ic_launcher.png app/src/main/res/mipmap-xhdpi/ic_launcher.png
cp app/src/main/res/mipmap-hdpi/ic_launcher.png app/src/main/res/mipmap-xxhdpi/ic_launcher.png
cp app/src/main/res/mipmap-hdpi/ic_launcher.png app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
rm icon.base64

# Create build.gradle for the app module
cat > app/build.gradle << EOF
apply plugin: 'com.android.application'

android {
    compileSdkVersion 33
    defaultConfig {
        applicationId "$PACKAGE_NAME"
        minSdkVersion 21
        targetSdkVersion 33
        versionCode 1
        versionName "1.0"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
    lintOptions {
        abortOnError false
    }
}

dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])
}
EOF

# Create build.gradle for the project
cat > build.gradle << EOF
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:7.3.1'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
EOF

# Create settings.gradle
cat > settings.gradle << EOF
include ':app'
EOF

# Create gradle.properties
cat > gradle.properties << EOF
org.gradle.jvmargs=-Xmx1536m
android.useAndroidX=false
android.enableJetifier=false
EOF

# Create local.properties (this would normally be auto-generated)
cat > local.properties << EOF
sdk.dir=/path/to/your/android/sdk
EOF

# Create simple instructions
cd ..
cat > simple-apk-instructions.txt << EOF
HOW TO BUILD AND INSTALL THE APK
================================

1. TO BUILD THE APK (using Android Studio):
   - Open Android Studio
   - Open the 'simple-apk-project' folder
   - Update local.properties with your Android SDK path
   - Click Build > Build Bundle(s) / APK(s) > Build APK(s)
   - The APK will be in: app/build/outputs/apk/debug/

2. TO BUILD APK (on online service):
   - Use a service like Appetize.io, AppyBuilder, or BuildAPK.com
   - Upload the source code (simple-apk-project folder)
   - Follow their build instructions

3. ONLINE ALTERNATIVES:
   → Use Appilix.com - simplest solution!
     - Go to https://www.appilix.com/
     - Enter app name: OnraVoice
     - Enter URL: https://secure-conference-1-kapilbajaj730.replit.app/
     - Enable permissions for microphone and internet
     - Download the APK they generate

4. TO INSTALL:
   - Transfer the APK to your Android device
   - Enable "Unknown Sources" in settings
   - Open the APK file on your device to install

If you need assistance with building the APK, please contact your developer for help.

What this app does:
- Opens the Replit URL in a full-screen WebView
- Provides access to the Onra Voice secure conference app
- Handles audio permissions for calls
- Works on Android 5.0 (Lollipop) and above
EOF

echo "Simple WebView APK project created!"
echo "See simple-apk-instructions.txt for next steps"