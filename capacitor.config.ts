import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.riceleafxnet.app',
  appName: 'RiceLeafXNet',
  webDir: 'out',
  server: {
    url: 'https://rice-leaf-disease-detection-ashen.vercel.app',
    cleartext: false
  }
};

export default config;