import { defineConfig } from 'wxt';
import { loadEnv } from 'vite';

const clientEnv = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env };
const publicAuthUrl = clientEnv.VITE_SUPABASE_URL;
const clientKey = clientEnv.VITE_SUPABASE_PUBLISHABLE_KEY;
if (publicAuthUrl && !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(publicAuthUrl))
  throw new Error('Use the exact HTTPS Supabase project URL.');
if (clientKey && !clientKey.startsWith('sb_publishable_')) {
  let publicRole = false;
  try {
    const claims: unknown = JSON.parse(
      Buffer.from(clientKey.split('.')[1] ?? '', 'base64url').toString(),
    );
    publicRole = Boolean(
      claims &&
      typeof claims === 'object' &&
      'role' in claims &&
      claims.role === 'anon',
    );
  } catch {
    /* Invalid or secret key. */
  }
  if (!publicRole)
    throw new Error(
      'Only a Supabase public client key may be bundled. Server keys are forbidden.',
    );
}

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
      ...(publicAuthUrl && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(publicAuthUrl)
        ? [`${publicAuthUrl}/*`]
        : []),
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
