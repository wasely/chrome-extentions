import { readFileSync } from 'node:fs';

const failures = [];
const evidence = JSON.parse(readFileSync('docs/release-evidence.json', 'utf8'));
const manifest = JSON.parse(readFileSync('.output/chrome-mv3/manifest.json', 'utf8'));
if (manifest.version !== evidence.candidateVersion)
  failures.push('Live evidence version does not match the build.');
for (const gate of [
  'localEmailAccess',
  'publicLinks',
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
