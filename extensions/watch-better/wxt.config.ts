import { defineConfig } from 'wxt';
import { loadEnv } from 'vite';
const collector = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env }
  .VITE_EMAIL_COLLECTOR_URL;
if (collector && !/^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev$/.test(collector))
  throw new Error('Use the exact HTTPS email collector workers.dev origin.');
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Watch Better',
    minimum_chrome_version: '133',
    description:
      'Preview YouTube videos from captions, ask signed-in AI, and skip unnecessary sections.',
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
    permissions: ['storage', 'declarativeNetRequest', 'webNavigation'],
    optional_host_permissions: ['https://*/*'],
    host_permissions: [
      'https://www.youtube.com/*',
      'https://chatgpt.com/*',
      'https://gemini.google.com/*',
      ...(collector ? [`${collector}/*`] : []),
    ],
    action: {
      default_title: 'Watch Better',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
        128: 'icon/128.png',
      },
    },
  },
});
