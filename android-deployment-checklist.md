# Onra Voice Android Deployment Checklist

Use this checklist to ensure a smooth deployment of your Onra Voice Android application.

## Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Supabase database configured
- [ ] Environment variables set for production
- [ ] API endpoints correctly pointing to production server
- [ ] WebSocket connections configured for production

### 2. Android-Specific Configuration
- [ ] All required permissions added to `AndroidManifest.xml`
- [ ] `capacitor.config.ts` properly configured for production
- [ ] Splash screen and app icons set up
- [ ] Deep linking configured (if applicable)

### 3. Feature Testing
- [ ] User authentication works on Android
- [ ] Push-to-talk functionality working properly
- [ ] Audio recording and playback functioning
- [ ] Room joining/leaving works as expected
- [ ] Connection status indicator accurate
- [ ] Recordings can be accessed and played

### 4. Performance Testing
- [ ] App launches quickly
- [ ] Audio latency is acceptable
- [ ] Battery usage is reasonable
- [ ] Memory usage is within acceptable limits
- [ ] Network usage optimized

## Build Process

### 1. Final Web Build
- [ ] Run `npm run build` to create production web build
- [ ] Verify all assets are included in the build
- [ ] Check for any build warnings or errors

### 2. Capacitor Update
- [ ] Run `npx cap copy android` to update Android project
- [ ] Run `npx cap update android` if needed

### 3. Android Build
- [ ] Open project in Android Studio: `npx cap open android`
- [ ] Update version code and name in `build.gradle`
- [ ] Run Gradle sync
- [ ] Test build on emulator or device
- [ ] Build signed APK or App Bundle

## Post-Build Testing

### 1. Installation Testing
- [ ] Fresh install on test device works properly
- [ ] App permissions granted correctly during first run
- [ ] App launches to login screen as expected

### 2. Functionality Testing
- [ ] Test all core features again on the built APK
- [ ] Verify database connection works in production build
- [ ] Check for any Android-specific issues

### 3. Edge Cases
- [ ] Test behavior when offline
- [ ] Test with poor network connectivity
- [ ] Test microphone permissions handling
- [ ] Verify storage permissions for recordings

## Distribution Preparation

### 1. Google Play Store (Recommended)
- [ ] Create/update Google Play Console listing
- [ ] Prepare store listing assets (screenshots, descriptions)
- [ ] Complete content rating questionnaire
- [ ] Set up pricing and distribution options
- [ ] Upload signed App Bundle
- [ ] Set up staged rollout

### 2. Direct APK Distribution
- [ ] Create download page for APK
- [ ] Generate QR code linking to download
- [ ] Include installation instructions for APK sideloading
- [ ] Test download and installation flow

## Final Security Check

- [ ] API endpoints secured with HTTPS
- [ ] Database access properly secured
- [ ] Authentication tokens secured in app storage
- [ ] Review WebRTC security settings
- [ ] Check for any hardcoded secrets or credentials

## Post-Launch Monitoring

- [ ] Set up error reporting
- [ ] Configure analytics for usage tracking
- [ ] Monitor server logs for errors
- [ ] Track database performance
- [ ] Plan for regular updates and maintenance

## Additional Notes

- Remember to increment version code for each new release
- Test on multiple Android devices with different OS versions if possible
- Consider implementing automated testing for critical functionality
- Set up a feedback channel for users to report issues

---

*This checklist ensures your Onra Voice Android application is properly configured, built, and ready for distribution to users.*