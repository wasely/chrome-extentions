import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings } from './settings';
describe('public release defaults', () => {
  it('starts in English with experimental skipping off', () => {
    expect(DEFAULT_SETTINGS.preferredCaptionLanguage).toBe('en');
    expect(DEFAULT_SETTINGS.smartSkip.autoSkip).toBe(false);
  });
  it('migrates old settings without enabling experimental skipping', () => {
    const migrated = normalizeSettings({
      schemaVersion: 3,
      theme: 'dark',
      smartSkip: { autoSkip: true },
    });
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.theme).toBe('dark');
    expect(migrated.smartSkip.autoSkip).toBe(false);
    expect(
      normalizeSettings({ schemaVersion: 4, smartSkip: { autoSkip: true } }).smartSkip
        .autoSkip,
    ).toBe(true);
  });
});
