package com.onravoice.app;

import android.os.Bundle;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Get the WebView
    WebView webView = this.bridge.getWebView();
    
    // Force in-memory storage mode
    webView.evaluateJavascript(
        "localStorage.setItem('USE_MEMORY_STORAGE', 'true');" +
        "console.log('Using in-memory storage with default users');" +
        "localStorage.setItem('ADMIN_USERNAME', 'admin');" +
        "localStorage.setItem('ADMIN_PASSWORD', 'admin123');" +
        "localStorage.setItem('USER_USERNAME', 'user');" +
        "localStorage.setItem('USER_PASSWORD', 'User@123');",
        null
    );
    
    // Set up logging
    webView.setWebChromeClient(new WebChromeClient() {
        @Override
        public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
            Log.d("OnraVoice", consoleMessage.message());
            return true;
        }
    });
  }
}
