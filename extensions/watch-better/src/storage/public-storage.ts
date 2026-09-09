import { browser } from 'wxt/browser';

export function isPublicStorageKey(area: string, key: string): boolean {
  if (area === 'local') return /^watchbetter:settings:v[234]$/.test(key);
  return (
    area === 'session' &&
    key.length <= 2048 &&
    (key.startsWith('watchbetter:transcript-cache:') ||
      key === 'watchbetter:transcript-cache-lru:v1' ||
      key === 'watchbetter:smart-skip-cache:v1')
  );
}

export function publicStorage(area: 'local' | 'session') {
  const contentScript =
    typeof location !== 'undefined' && location.protocol === 'https:';
  if (!contentScript) return browser.storage[area];
  const send = async (operation: 'get' | 'set' | 'remove', data: unknown) => {
    const response: { ok: boolean; value?: Record<string, unknown>; message?: string } =
      await browser.runtime.sendMessage({
        type: 'public:storage',
        area,
        operation,
        data,
      });
    if (!response?.ok)
      throw new Error(response?.message ?? 'Could not access extension settings.');
    return response.value ?? {};
  };
  return {
    get: (key: string) => send('get', key),
    set: async (values: Record<string, unknown>) => {
      await send('set', values);
    },
    remove: async (keys: string | string[]) => {
      await send('remove', keys);
    },
  };
}
