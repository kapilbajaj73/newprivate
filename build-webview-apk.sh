#!/bin/bash

# WebView APK Builder Script for Onra Voice
# This script creates a simple Android WebView app that loads your Replit app

# Configuration
APP_NAME="OnraVoice"
PACKAGE_NAME="com.onravoice.app"
WEB_URL="https://secure-conference-1-kapilbajaj730.replit.app/"
MIN_SDK=21
TARGET_SDK=33

# Create directory structure
echo "Creating project directory structure..."
mkdir -p webview-apk/app/src/main/java/com/onravoice/app
mkdir -p webview-apk/app/src/main/res/layout
mkdir -p webview-apk/app/src/main/res/values
mkdir -p webview-apk/app/src/main/res/xml
mkdir -p webview-apk/gradle/wrapper

# Change to project directory
cd webview-apk

# Create build.gradle (project level)
cat > build.gradle << 'EOF'
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

task clean(type: Delete) {
    delete rootProject.buildDir
}
EOF

# Create settings.gradle
cat > settings.gradle << 'EOF'
include ':app'
EOF

# Create gradle.properties
cat > gradle.properties << 'EOF'
org.gradle.jvmargs=-Xmx2048m
android.useAndroidX=true
android.enableJetifier=true
EOF

# Create gradle-wrapper.properties
cat > gradle/wrapper/gradle-wrapper.properties << 'EOF'
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-7.4-all.zip
EOF

# Create app/build.gradle
cat > app/build.gradle << EOF
plugins {
    id 'com.android.application'
}

android {
    compileSdkVersion $TARGET_SDK
    
    defaultConfig {
        applicationId "$PACKAGE_NAME"
        minSdkVersion $MIN_SDK
        targetSdkVersion $TARGET_SDK
        versionCode 1
        versionName "1.0"
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.4.1'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.3'
}
EOF

# Create MainActivity.java
cat > app/src/main/java/com/onravoice/app/MainActivity.java << EOF
package $PACKAGE_NAME;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.Manifest;
import android.content.pm.PackageManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {
    
    private WebView webView;
    private static final int PERMISSION_REQUEST_CODE = 100;
    private static final String[] PERMISSIONS = {
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.MODIFY_AUDIO_SETTINGS,
        Manifest.permission.INTERNET
    };

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // Check permissions
        checkPermissions();
        
        webView = findViewById(R.id.webView);
        
        // Configure WebView settings
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
        
        // Force memory storage mode for standalone operation
        webView.evaluateJavascript("localStorage.setItem('USE_MEMORY_STORAGE', 'true');", null);
        
        // Handle WebView client
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });
        
        // Handle WebChromeClient for permission requests
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }
        });
        
        // Load the URL
        webView.loadUrl("$WEB_URL");
    }
    
    private void checkPermissions() {
        for (String permission : PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, PERMISSIONS, PERMISSION_REQUEST_CODE);
                break;
            }
        }
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
cat > app/src/main/res/layout/activity_main.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintLeft_toLeftOf="parent"
        app:layout_constraintRight_toRightOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
EOF

# Create strings.xml
cat > app/src/main/res/values/strings.xml << EOF
<resources>
    <string name="app_name">$APP_NAME</string>
</resources>
EOF

# Create network_security_config.xml
cat > app/src/main/res/xml/network_security_config.xml << 'EOF'
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
        android:roundIcon="@mipmap/ic_launcher_round"
        android:label="@string/app_name"
        android:networkSecurityConfig="@xml/network_security_config"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.Light.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
EOF

# Create placeholder launcher icons directories
mkdir -p app/src/main/res/mipmap-mdpi
mkdir -p app/src/main/res/mipmap-hdpi
mkdir -p app/src/main/res/mipmap-xhdpi
mkdir -p app/src/main/res/mipmap-xxhdpi
mkdir -p app/src/main/res/mipmap-xxxhdpi

# Create a base64-encoded PNG icon (a blue square with white text "OV")
cat > tmp_icon.base64 << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAAABGdBTUEAALGPC/xhBQAAACBjSFJN
AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAOVBMVEUaH0L///8aH0IaH0Ia
H0IaH0IaH0IaH0IaH0IaH0IaH0IaH0IaH0IaH0IaH0IaH0IaH0IaH0L///+QUAHfAAAAEXRSTlMA
AAAQ8OCgkGAwgEDQsHDgUEPE1U8AAAABYktHRBJ7vGwAAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAB
nklEQVRo3u2Z246DMAxFExICgQTm/z92HgptmYu9HTlSH+KjviD5JNgJl0PZ4wZw6XNs0Y2DRfQR
FGccHAQdI+hfhhAdBBk+AYZsRUB/Y4YHQcYPgHGxIYj+xoxFARCqAVOyIIjexgwpGKAEsMwGBNnX
mGUJBKgB0zoeoHoaM6UHAx4A82jAr58xnzcD1ACW0YBeP2OWmQHPgCXfadTLmDmHBhQA3KKRkzHR
AYBbkTExAYAkYGAAAxi4KwLMDAziO4UAaDZHgNkT8Pf/EwGXGwOW+MBFDFhSPYDUeQWQvQeQPC8A
snc/AYSe5QERcP0AIuA2AkTA5YuIgNuIEAGX7yECbiNABFwmQATcBoQIuHwPEXAbACLg8iVEwE1i
IoD3TQTwfokA1icRsL9fImB/n0TA/v6gALYvKIDtBwpg+4AC2D6gALZ9KIBtGwpg24UC2DahALY9
KIBtCwpoNmWfNqCAE2hKgAJOoTL+Bd4TzgCXBWdQ3QVnMH9ynkHfE85gfud8Az/QrpDwpKzL/nXh
rSdN++fR60nVnofHp5W3p/XvdA+n7XwmMGnpuQAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMi0wMy0z
MVQyMzowNzoxOSswMDowMB+5+6MAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjItMDMtMzFUMjM6MDc6
MTkrMDA6MDBu5EMfAAAAAElFTkSuQmCC
EOF

# Create PNG files from base64 for all resolutions
base64 -d tmp_icon.base64 > app/src/main/res/mipmap-mdpi/ic_launcher.png

# Copy and resize for other densities
cp app/src/main/res/mipmap-mdpi/ic_launcher.png app/src/main/res/mipmap-hdpi/ic_launcher.png
cp app/src/main/res/mipmap-mdpi/ic_launcher.png app/src/main/res/mipmap-xhdpi/ic_launcher.png
cp app/src/main/res/mipmap-mdpi/ic_launcher.png app/src/main/res/mipmap-xxhdpi/ic_launcher.png
cp app/src/main/res/mipmap-mdpi/ic_launcher.png app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# Round icon (same as regular icon for simplicity)
cp app/src/main/res/mipmap-mdpi/ic_launcher.png app/src/main/res/mipmap-mdpi/ic_launcher_round.png
cp app/src/main/res/mipmap-hdpi/ic_launcher.png app/src/main/res/mipmap-hdpi/ic_launcher_round.png
cp app/src/main/res/mipmap-xhdpi/ic_launcher.png app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
cp app/src/main/res/mipmap-xxhdpi/ic_launcher.png app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
cp app/src/main/res/mipmap-xxxhdpi/ic_launcher.png app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png

# Clean up
rm tmp_icon.base64

# Create instructions for building
cat > ../webview-apk-instructions.md << 'EOF'
# WebView APK Building Instructions

This script has created a basic Android WebView app project that loads your Replit app URL.

## Requirements

To build the APK, you'll need:
1. Android Studio installed
2. Java Development Kit (JDK) 8 or newer

## Building the APK

1. Open the 'webview-apk' folder in Android Studio
2. Let it sync the Gradle files
3. Replace the placeholder launcher icon in app/src/main/res/mipmap-*/ folders with your own app icon
4. Build the APK by selecting Build > Build Bundle(s) / APK(s) > Build APK(s)
5. The APK will be generated in app/build/outputs/apk/debug/

## Features of this WebView app:

- Loads your Replit app URL
- Handles audio permissions for conference calls
- Forces in-memory storage mode for standalone operation
- Includes a network security configuration to allow necessary connections

## Installing the APK

1. Transfer the APK to your Android device
2. Open the file on your device to install (you may need to enable installation from unknown sources)
3. Launch the app

## Important Notes

- This is a simple WebView wrapper for your web app
- You may need to further customize the app for specific features
- For a more integrated experience, consider using the Capacitor approach instead

EOF

cd ..
echo "WebView APK project created successfully!"
echo "See webview-apk-instructions.md for build instructions."