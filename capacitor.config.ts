import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.win.warrantycheck',
  appName: 'wintech101',
  webDir: 'dist',
  server: {
    url: 'https://9ed0e90b-29ad-4c6a-9225-1a90e7fd79ca.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
