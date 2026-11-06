import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.riceleafxnet.app',
  appName: 'RiceLeafXNet',
  webDir: 'out',
  server: {
    url: 'https://rice-leaf-x-net-git-main-rice-7b1e.vercel.app',
    cleartext: false
  }
};

export default config;
