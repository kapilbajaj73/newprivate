import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.onravoice.app',
  appName: 'Onra Voice',
  webDir: 'dist/public',  // Updated path to match Vite output
  // No server config for standalone app
  android: {
    allowMixedContent: true,
    backgroundColor: '#1A1F2C',
    captureInput: true,
    webContentsDebuggingEnabled: true,
    // Add any additional Android configuration here
    useLegacyBridge: false
    // Remove build options to fix type errors
  }
};

export default config;