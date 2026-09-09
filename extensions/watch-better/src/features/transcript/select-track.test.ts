import { describe, expect, it } from 'vitest';
import { selectTranscriptTrack } from './select-track';
import type { TranscriptTrack } from './domain';

const tracks: TranscriptTrack[] = [
  { id: 'es', languageCode: 'es', languageLabel: 'Spanish', isAutomatic: false },
  {
    id: 'es:tlang=en',
    languageCode: 'en',
    languageLabel: 'English (translated)',
    isAutomatic: false,
    isTranslated: true,
  },
  {
    id: 'en-auto',
    languageCode: 'en',
    languageLabel: 'English automatic',
    isAutomatic: true,
  },
  {
    id: 'en-human',
    languageCode: 'en-US',
    languageLabel: 'English',
    isAutomatic: false,
  },
];
describe('English caption selection', () => {
  it('prefers human English, then automatic English, then translation', () => {
    expect(selectTranscriptTrack(tracks)?.id).toBe('en-human');
    expect(selectTranscriptTrack(tracks.slice(0, 3))?.id).toBe('en-auto');
    expect(selectTranscriptTrack(tracks.slice(0, 2))?.id).toBe('es:tlang=en');
  });
  it('honors explicit choices and original-language preference', () => {
    expect(selectTranscriptTrack(tracks, 'es')?.id).toBe('es');
    expect(selectTranscriptTrack(tracks, null, 'original')?.id).toBe('es');
  });
  it('falls back honestly and handles unavailable captions', () => {
    expect(selectTranscriptTrack(tracks.slice(0, 1))?.id).toBe('es');
    expect(selectTranscriptTrack([])).toBeUndefined();
  });
});
