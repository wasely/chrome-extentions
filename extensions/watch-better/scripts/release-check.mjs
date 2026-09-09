import { readFileSync } from 'node:fs';
import { loadEnv } from 'vite';

const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env };
const url = env.VITE_SUPABASE_URL ?? '';
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
const failures = [];
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))
  failures.push('Valid Supabase project URL missing.');
if (!key || /test|example|replace/i.test(key))
  failures.push('Public Supabase client key missing.');
if (key.startsWith('sb_secret_'))
  failures.push('Secret server key is forbidden in the extension.');
if (key.split('.').length === 3) {
  try {
    const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
    if (claims.role !== 'anon')
      failures.push('Only an anon or publishable client key is allowed.');
  } catch {
    failures.push('Invalid public client key.');
  }
} else if (key && !key.startsWith('sb_publishable_'))
  failures.push('Expected a Supabase publishable key.');
const evidence = JSON.parse(readFileSync('docs/release-evidence.json', 'utf8'));
const manifest = JSON.parse(readFileSync('.output/chrome-mv3/manifest.json', 'utf8'));
if (!manifest.host_permissions.includes(`${url}/*`))
  failures.push('Built manifest does not include the configured Auth host.');
if (manifest.version !== evidence.candidateVersion)
  failures.push('Live evidence version does not match the build.');
for (const gate of [
  'emailDelivery',
  'accountDeletion',
  'cleanInstall',
  'embeddedProviders',
  'personalApiProviders',
  'youtubeLifecycle',
  'desktopPlatforms',
  'storeAssetsReviewed',
]) {
  if (evidence[gate] !== true) failures.push(`Live evidence missing: ${gate}.`);
}
if (failures.length) {
  console.error(
    'Store packaging blocked:\n' + failures.map((failure) => `- ${failure}`).join('\n'),
  );
  process.exitCode = 1;
} else
  console.log(
    'Configuration and recorded release gates passed. Inspect the final ZIP before submission.',
  );
