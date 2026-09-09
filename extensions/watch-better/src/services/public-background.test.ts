import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted<{
  local: Record<string, unknown>;
  session: Record<string, unknown>;
}>(() => ({
  local: {},
  session: {},
}));
vi.mock('wxt/browser', () => {
  const area = (data: Record<string, unknown>) => ({
    get: vi.fn((keys: string | string[]) =>
      Promise.resolve(
        Object.fromEntries(
          (Array.isArray(keys) ? keys : [keys]).map((key) => [key, data[key]]),
        ),
      ),
    ),
    set: vi.fn((values: Record<string, unknown>) => {
      Object.assign(data, values);
      return Promise.resolve();
    }),
    remove: vi.fn((keys: string | string[]) => {
      for (const key of Array.isArray(keys) ? keys : [keys]) delete data[key];
      return Promise.resolve();
    }),
    clear: vi.fn(() => Promise.resolve()),
  });
  return {
    browser: {
      runtime: {
        getURL: () => 'chrome-extension://extension-id/',
        sendMessage: () => Promise.resolve(),
      },
      storage: { local: area(state.local), session: area(state.session) },
      tabs: { query: () => Promise.resolve([]) },
      permissions: {
        contains: () => Promise.resolve(true),
        remove: () => Promise.resolve(true),
      },
    },
  };
});
import { apiService, authService, handlePublicRequest } from './public-background';
const content = {
  url: 'https://www.youtube.com/watch?v=abcdefghijk',
  frameId: 0,
  tab: { id: 1, url: 'https://www.youtube.com/watch?v=abcdefghijk' },
};
const options = {
  url: 'chrome-extension://extension-id/options.html',
  frameId: 0,
  tab: { id: 2 },
};

describe('public background privilege boundary', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    for (const data of [state.local, state.session])
      for (const key of Object.keys(data)) delete data[key];
  });
  it('rejects provider frames and unrelated sites before reading private status', async () => {
    const status = vi.spyOn(authService, 'status');
    for (const sender of [
      { ...content, frameId: 2 },
      { ...content, url: 'https://example.com/' },
    ])
      expect(
        (await handlePublicRequest({ type: 'public:auth-status' }, sender)).ok,
      ).toBe(false);
    expect(status).not.toHaveBeenCalled();
  });
  it('returns access state without email or tokens to YouTube', async () => {
    vi.spyOn(authService, 'status').mockResolvedValue({
      kind: 'unlocked',
      email: 'viewer@example.com',
    });
    expect(await handlePublicRequest({ type: 'public:auth-status' }, content)).toEqual({
      ok: true,
      value: { kind: 'unlocked', email: '' },
    });
    expect(
      (await handlePublicRequest({ type: 'public:auth-status' }, options)).value,
    ).toMatchObject({ email: 'viewer@example.com' });
  });
  it('blocks account changes and secret storage reads from content scripts', async () => {
    for (const type of [
      'public:enter-email',
      'public:sign-out',
      'public:api-configure',
    ])
      expect(
        (
          await handlePublicRequest(
            { type, email: 'viewer@example.com', code: '123456' },
            content,
          )
        ).ok,
      ).toBe(false);
    for (const key of [
      'watchbetter:email:v1',
      'watchbetter:auth:v1',
      'watchbetter:api-key:v1',
      '__proto__',
    ])
      expect(
        (
          await handlePublicRequest(
            { type: 'public:storage', area: 'local', operation: 'get', data: key },
            content,
          )
        ).ok,
      ).toBe(false);
  });
  it('unlocks from settings immediately and removes email and API keys locally', async () => {
    const entered = await handlePublicRequest(
      { type: 'public:enter-email', email: 'viewer@example.com' },
      options,
    );
    expect(entered).toEqual({
      ok: true,
      value: { kind: 'unlocked', email: 'viewer@example.com' },
    });
    expect(state.local['watchbetter:email:v1']).toBe('viewer@example.com');
    expect(
      (await handlePublicRequest({ type: 'public:auth-status' }, content)).value,
    ).toEqual({ kind: 'unlocked', email: '' });
    await apiService.configure(
      { kind: 'gemini', model: 'test-model' },
      'fixture-private-value',
      true,
    );
    expect((await handlePublicRequest({ type: 'public:sign-out' }, options)).ok).toBe(
      true,
    );
    expect(state.local['watchbetter:email:v1']).toBeUndefined();
    expect(state.local['watchbetter:api-key:v1']).toBeUndefined();
    expect(await authService.status()).toEqual({ kind: 'signed-out' });
  });
  it('rejects invalid email and removed code endpoints', async () => {
    for (const message of [
      { type: 'public:enter-email', email: 'bad' },
      { type: 'public:enter-email', email: null },
      { type: 'public:send-code', email: 'viewer@example.com' },
      { type: 'public:verify-code', email: 'viewer@example.com', code: '123456' },
    ])
      expect((await handlePublicRequest(message, options)).ok).toBe(false);
    expect(await authService.status()).toEqual({ kind: 'signed-out' });
  });
  it('keeps session keys private and removes them on disconnect', async () => {
    const configuration = { kind: 'gemini', model: 'test-model' };
    await apiService.configure(configuration, 'fixture-private-value', false);
    expect(state.local['watchbetter:api-key:v1']).toBeUndefined();
    expect(state.session['watchbetter:api-key:v1']).toBe('fixture-private-value');
    expect(JSON.stringify(await apiService.status())).not.toContain(
      'fixture-private-value',
    );
    await apiService.disconnect();
    expect(state.session['watchbetter:api-key:v1']).toBeUndefined();
    expect((await apiService.status()).connected).toBe(false);
  });
});
