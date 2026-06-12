import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gentongmas.erp',
  appName: 'Gentong Mas ERP',
  webDir: 'out',

  server: {
    /**
     * Mode: "Live Server"
     * APK akan membuka WebView yang mengarah ke Next.js yang berjalan di jaringan lokal.
     * URL ini bisa diubah user dari halaman Settings → Koneksi Server.
     * Ganti dengan IP CasaOS kamu: http://<IP_CASAOS>:3000
     */
    url: 'http://192.168.18.42:3000',
    cleartext: true,
    androidScheme: 'http',
    iosScheme: 'http',
    allowNavigation: ['192.168.*', '10.*', '172.16.*', '172.17.*', '172.18.*', '172.19.*', '172.20.*', '172.21.*', '172.22.*', '172.23.*', '172.24.*', '172.25.*', '172.26.*', '172.27.*', '172.28.*', '172.29.*', '172.30.*', '172.31.*'],
  },

  android: {
    path: 'android',
    minWebViewVersion: 60,
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },

  ios: {
    path: 'ios',
    contentInset: 'always',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#7367F0',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#7367F0',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
