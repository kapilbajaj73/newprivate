#!/bin/bash

# Fixed WebView APK Generator
# This script creates a very basic Android WebView app that loads your Replit URL

# Set your app details
APP_NAME="OnraVoice"
PACKAGE_NAME="com.onravoice.app"
WEB_URL="https://secure-conference-1-kapilbajaj730.replit.app/"

echo "Creating fixed WebView APK for $WEB_URL"
echo "----------------------------------------"

# Create project directories
mkdir -p fixed-webview/app/src/main/java/com/onravoice/app
mkdir -p fixed-webview/app/src/main/res/layout
mkdir -p fixed-webview/app/src/main/res/values
mkdir -p fixed-webview/app/src/main/res/xml
mkdir -p fixed-webview/app/src/main/res/mipmap-hdpi
mkdir -p fixed-webview/app/src/main/res/mipmap-mdpi
mkdir -p fixed-webview/app/src/main/res/mipmap-xhdpi
mkdir -p fixed-webview/app/src/main/res/mipmap-xxhdpi
mkdir -p fixed-webview/app/src/main/res/mipmap-xxxhdpi
mkdir -p fixed-webview/gradle/wrapper

cd fixed-webview

# Create a simpler MainActivity.java with proper null checking
cat > app/src/main/java/com/onravoice/app/MainActivity.java << EOF
package com.onravoice.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    
    private WebView webView;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        webView = (WebView) findViewById(R.id.webView);
        if (webView != null) {
            WebSettings webSettings = webView.getSettings();
            webSettings.setJavaScriptEnabled(true);
            webSettings.setDomStorageEnabled(true);
            webSettings.setSupportZoom(true);
            webView.setWebViewClient(new WebViewClient());
            webView.loadUrl("$WEB_URL");
        }
    }
    
    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
EOF

# Create activity_main.xml with simple layout
cat > app/src/main/res/layout/activity_main.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</LinearLayout>
EOF

# Create strings.xml
cat > app/src/main/res/values/strings.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">$APP_NAME</string>
</resources>
EOF

# Create network security config
cat > app/src/main/res/xml/network_security_config.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
EOF

# Create a simple AndroidManifest.xml
cat > app/src/main/AndroidManifest.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.onravoice.app">

    <uses-permission android:name="android.permission.INTERNET" />

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

# Create a simple icon file (base64 png data)
cat > icon_data.txt << EOF
iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAAABGdBTUEAALGPC/xhBQAAACBjSFJN
AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAElBMVEUaH0IaH0IaH0IaH0Ia
H0L///8xbK7/AAAABXRSTlMAAAAAAMJrBrEAAAABYktHRAZhZrh9AAAACXBIWXMAAAsTAAALEwEA
mpwYAAAAB3RJTUUH5gMgACIOA2TtZQAAAC5JREFUaN7tzEEBAAAEBLCj/qV3gngQgYLhAQAAAAAA
AAAAAAAAAAAAAACAwQFYfAABJZqF+wAAAABJRU5ErkJggg==
EOF

# Create the icon files
base64 -d icon_data.txt > app/src/main/res/mipmap-hdpi/ic_launcher.png
cp app/src/main/res/mipmap-hdpi/ic_launcher.png app/src/main/res/mipmap-mdpi/ic_launcher.png
cp app/src/main/res/mipmap-hdpi/ic_launcher.png app/src/main/res/mipmap-xhdpi/ic_launcher.png
cp app/src/main/res/mipmap-hdpi/ic_launcher.png app/src/main/res/mipmap-xxhdpi/ic_launcher.png
cp app/src/main/res/mipmap-hdpi/ic_launcher.png app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
rm icon_data.txt

# Create app build.gradle - simplified
cat > app/build.gradle << EOF
apply plugin: 'com.android.application'

android {
    compileSdkVersion 31
    defaultConfig {
        applicationId "com.onravoice.app"
        minSdkVersion 16
        targetSdkVersion 31
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

# Create root build.gradle - simplified for compatibility
cat > build.gradle << EOF
buildscript {
    repositories {
        google()
        jcenter()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:4.2.2'
    }
}

allprojects {
    repositories {
        google()
        jcenter()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
EOF

# Create settings.gradle
cat > settings.gradle << EOF
include ':app'
EOF

# Create gradle.properties - compatibility settings
cat > gradle.properties << EOF
org.gradle.jvmargs=-Xmx1536m
android.useAndroidX=false
android.enableJetifier=false
EOF

# Create gradle-wrapper.properties
cat > gradle/wrapper/gradle-wrapper.properties << EOF
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-6.9-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
EOF

# Create local.properties template
cat > local.properties << EOF
## This file must *NOT* be checked into Version Control Systems,
# as it contains information specific to your local configuration.
#
# Location of the SDK. This is only used by Gradle.
# For customization when using a Version Control System, please read the
# header note.
sdk.dir=/path/to/your/android/sdk
EOF

cd ..

# Create simple build instructions
cat > manual-build-instructions.txt << EOF
HOW TO BUILD YOUR WEBVIEW APK MANUALLY
======================================

OPTION 1: Using Android Studio (Recommended)
-------------------------------------------
1. Download and install Android Studio from: 
   https://developer.android.com/studio

2. Open Android Studio
3. Select "Open an Existing Project"
4. Navigate to the "fixed-webview" folder created by this script
5. Edit local.properties to point to your Android SDK location
   (Android Studio might do this automatically)
6. Click Build > Build Bundle(s) / APK(s) > Build APK(s)
7. The APK will be in: app/build/outputs/apk/debug/app-debug.apk

OPTION 2: Using Command Line (Advanced)
-------------------------------------
1. Install the Android SDK and set up your environment
2. Edit local.properties to point to your Android SDK
3. Run the following commands:
   cd fixed-webview
   ./gradlew assembleDebug
4. The APK will be in: app/build/outputs/apk/debug/app-debug.apk

INSTALLING ON YOUR DEVICE
------------------------
1. Enable "Install from Unknown Sources" in your device settings
2. Transfer the APK to your device
3. Find the APK file on your device and tap to install

MODIFICATIONS
------------
To modify the app:
- Change the URL in MainActivity.java
- Update the app icon in mipmap folders
- Add permissions in AndroidManifest.xml

The app has been simplified to avoid Java errors during compilation.
EOF

echo "Fixed WebView APK project created in the fixed-webview directory"
echo "See manual-build-instructions.txt for build instructions"