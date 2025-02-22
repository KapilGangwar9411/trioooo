import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'gopool',
  webDir: 'www',
  cordova: {
    preferences: {
      ScrollEnabled: 'false',
      'android-minSdkVersion': '24',
      'android-targetSdkVersion': '33',
      BackupWebStorage: 'none',
      SplashMaintainAspectRatio: 'true',
      SplashShowOnlyFirstTime: 'false',
      SplashScreen: 'screen',
      ShowSplashScreenSpinner: 'false',
      FadeSplashScreen: 'false',
      AutoHideSplashScreen: 'false',
      orientation: 'portrait',
      AndroidPersistentFileLocation: 'Compatibility'
    }
  }
};

export default config;
