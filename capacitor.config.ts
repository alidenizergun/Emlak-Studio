import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  'https://emlak-studio.vercel.app';
const hostedShellDir = 'capacitor-shell';

const config: CapacitorConfig = {
  appId: 'com.studioestate.app',
  appName: 'Studio Estate',
  // The native shell boots the deployed app from `server.url`.
  // `webDir` remains a tiny local bundle so Capacitor sync/generation stays valid.
  webDir: hostedShellDir,
  server: {
    url: serverUrl,
    cleartext: false,
    errorPath: 'error.html',
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
