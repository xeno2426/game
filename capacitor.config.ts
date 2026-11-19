import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xeno2426.game',
  appName: 'Tidebound',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
