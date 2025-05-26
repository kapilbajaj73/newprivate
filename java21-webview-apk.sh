#!/bin/bash

# Java 21 Compatible WebView APK Generator
# This script creates a WebView app compatible with newer Java versions

# Set your app details
APP_NAME="OnraVoice"
PACKAGE_NAME="com.onravoice.app"
WEB_URL="https://secure-conference-1-kapilbajaj730.replit.app/"

echo "Creating Java 21 compatible WebView APK for $WEB_URL"
echo "---------------------------------------------------"

# Create project directories
mkdir -p java21-webview/app/src/main/java/com/onravoice/app
mkdir -p java21-webview/app/src/main/res/layout
mkdir -p java21-webview/app/src/main/res/values
mkdir -p java21-webview/app/src/main/res/xml
mkdir -p java21-webview/app/src/main/res/mipmap-hdpi
mkdir -p java21-webview/app/src/main/res/mipmap-mdpi
mkdir -p java21-webview/app/src/main/res/mipmap-xhdpi
mkdir -p java21-webview/app/src/main/res/mipmap-xxhdpi
mkdir -p java21-webview/app/src/main/res/mipmap-xxxhdpi
mkdir -p java21-webview/gradle/wrapper

cd java21-webview

# Create MainActivity.java with proper null checking
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

# Create AndroidManifest.xml
cat > app/src/main/AndroidManifest.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.onravoice.app">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />

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

# Create app build.gradle - updated for Java 21 compatibility
cat > app/build.gradle << EOF
plugins {
    id 'com.android.application'
}

android {
    compileSdkVersion 33
    
    defaultConfig {
        applicationId "com.onravoice.app"
        minSdkVersion 21
        targetSdkVersion 33
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
        sourceCompatibility JavaVersion.VERSION_11
        targetCompatibility JavaVersion.VERSION_11
    }
    
    lintOptions {
        abortOnError false
    }
}

dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])
}
EOF

# Create root build.gradle - updated for Java 21
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

task clean(type: Delete) {
    delete rootProject.buildDir
}
EOF

# Create settings.gradle
cat > settings.gradle << EOF
include ':app'
EOF

# Create gradle.properties with newer settings
cat > gradle.properties << EOF
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
org.gradle.java.home=/Library/Java/JavaVirtualMachines/jdk-11.jdk/Contents/Home
EOF

# Create gradle-wrapper.properties with latest gradle
cat > gradle/wrapper/gradle-wrapper.properties << EOF
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-7.5.1-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
EOF

# Create local.properties template
cat > local.properties << EOF
## This file must *NOT* be checked into Version Control Systems,
# as it contains information specific to your local configuration.
#
# Location of the SDK. This is only used by Gradle.
sdk.dir=/path/to/your/android/sdk

# If you're using Java 21, set this to point to JDK 11
org.gradle.java.home=/Library/Java/JavaVirtualMachines/jdk-11.jdk/Contents/Home
EOF

cd ..

# Create Java 21 compatible build instructions
cat > java21-build-instructions.txt << EOF
JAVA 21 COMPATIBLE WEBVIEW APK BUILD INSTRUCTIONS
================================================

IMPORTANT NOTE: You need JDK 11 installed alongside Java 21
------------------------------------------------------
Android Gradle Plugin doesn't fully support Java 21 yet. You need to have 
JDK 11 installed on your system for building Android apps.

1. INSTALL JDK 11
-----------------
On macOS:
- Download from: https://www.oracle.com/java/technologies/javase-jdk11-downloads.html
- Or install using Homebrew: brew install openjdk@11

2. CONFIGURE YOUR PROJECT
------------------------
- Edit java21-webview/local.properties to point to:
  a) Your Android SDK location
  b) Your JDK 11 installation path
  
  Example:
  sdk.dir=/Users/username/Library/Android/sdk
  org.gradle.java.home=/Library/Java/JavaVirtualMachines/jdk-11.jdk/Contents/Home

3. BUILDING WITH ANDROID STUDIO
------------------------------
- Open Android Studio
- Open the java21-webview project
- When prompted to sync Gradle, click "OK"
- Go to Build > Build Bundle(s) / APK(s) > Build APK(s)
- The APK will be in: app/build/outputs/apk/debug/app-debug.apk

4. INSTALL ON YOUR DEVICE
------------------------
- Enable "Install from Unknown Sources" in settings
- Transfer the APK to your device
- Tap on the APK file to install

TROUBLESHOOTING
--------------
If you see "Unsupported class file major version" errors:
1. Make sure you have JDK 11 installed
2. Verify the path in local.properties is correct
3. Restart Android Studio

USING A DIFFERENT JAVA VERSION FOR ANDROID STUDIO
-----------------------------------------------
You can configure Android Studio to use JDK 11 while keeping Java 21 as your system default:
1. In Android Studio, go to File > Settings > Build, Execution, Deployment > Build Tools > Gradle
2. Set "Gradle JDK" to version 11
EOF

echo "Java 21 compatible WebView APK project created!"
echo "See java21-build-instructions.txt for detailed build instructions"