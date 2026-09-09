import { describe, expect, it } from 'vitest';
import { isPublicStorageKey } from './public-storage';

describe('content-script storage boundary', () => {
  it('allows settings and bounded caption caches, never credentials or identity', () => {
    expect(isPublicStorageKey('local', 'watchbetter:settings:v4')).toBe(true);
    expect(isPublicStorageKey('session', 'watchbetter:transcript-cache:abc:en')).toBe(
      true,
    );
    for (const key of [
      'watchbetter:auth:v1',
      'watchbetter:api-key:v1',
      'watchbetter:webchat-frames:v2',
      '__proto__',
    ]) {
      expect(isPublicStorageKey('local', key)).toBe(false);
      expect(isPublicStorageKey('session', key)).toBe(false);
    }
  });
});
