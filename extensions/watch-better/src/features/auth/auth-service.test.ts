import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth-service';

function fixture() {
  const values: Record<string, unknown> = {};
  const storage = {
    get: (key: string) => Promise.resolve({ [key]: values[key] }),
    set: (data: Record<string, unknown>) => {
      Object.assign(values, data);
      return Promise.resolve();
    },
    remove: (key: string) => {
      delete values[key];
      return Promise.resolve();
    },
  };
  const fetcher = vi.fn<typeof fetch>();
  let now = 1_800_000_000_000;
  const service = new AuthService(
    { url: 'https://project.supabase.co', publishableKey: 'public-test-key' },
    storage,
    fetcher,
    () => now,
  );
  const verified = () =>
    new Response(
      JSON.stringify({
        access_token: 'example-access',
        refresh_token: 'example-refresh',
        expires_in: 3600,
        user: {
          id: 'user-one',
          email: 'viewer@example.com',
          email_confirmed_at: '2026-01-01',
        },
      }),
    );
  return {
    service,
    values,
    fetcher,
    verified,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe('public email authentication', () => {
  it('fails closed without a backend and never unlocks an unconfirmed address', async () => {
    const f = fixture();
    expect((await f.service.status()).kind).toBe('signed-out');
    f.fetcher.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          access_token: 'x',
          refresh_token: 'y',
          expires_in: 3600,
          user: { id: 'u', email: 'viewer@example.com' },
        }),
      ),
    );
    await expect(
      f.service.verifyCode('viewer@example.com', '123456'),
    ).rejects.toThrow();
    expect((await f.service.status()).kind).toBe('signed-out');
  });
  it('unlocks after verification without returning tokens and remembers the session', async () => {
    const f = fixture();
    f.fetcher.mockResolvedValueOnce(f.verified());
    const state = await f.service.verifyCode('viewer@example.com', '123456');
    expect(state).toMatchObject({ kind: 'verified', email: 'viewer@example.com' });
    expect(JSON.stringify(state)).not.toMatch(/example-access|example-refresh/);
    expect((await f.service.status()).kind).toBe('verified');
    expect(f.fetcher).toHaveBeenCalledTimes(1);
  });
  it('retains verified access briefly during outages, but not after seven days', async () => {
    const f = fixture();
    f.fetcher.mockResolvedValueOnce(f.verified());
    await f.service.verifyCode('viewer@example.com', '123456');
    f.advance(4_000_000);
    f.fetcher.mockRejectedValue(new TypeError('offline'));
    expect(await f.service.status()).toMatchObject({ kind: 'verified', offline: true });
    f.advance(8 * 86400_000);
    expect((await f.service.status()).kind).toBe('signed-out');
  });
  it('does not treat revoked refresh tokens as an offline outage', async () => {
    const f = fixture();
    f.fetcher.mockResolvedValueOnce(f.verified());
    await f.service.verifyCode('viewer@example.com', '123456');
    f.advance(4_000_000);
    f.fetcher.mockResolvedValueOnce(new Response('{}', { status: 400 }));
    expect((await f.service.status()).kind).toBe('signed-out');
  });
  it('validates addresses/codes before network and throttles resends', async () => {
    const f = fixture();
    await expect(f.service.requestCode('bad')).rejects.toThrow();
    await expect(f.service.verifyCode('viewer@example.com', '123')).rejects.toThrow();
    expect(f.fetcher).not.toHaveBeenCalled();
    f.fetcher.mockResolvedValue(new Response('{}'));
    await f.service.requestCode('viewer@example.com');
    await expect(f.service.requestCode('viewer@example.com')).rejects.toThrow(/wait/i);
    expect(f.fetcher).toHaveBeenCalledTimes(1);
  });
  it('clears local authentication on logout even if the provider is offline', async () => {
    const f = fixture();
    f.fetcher.mockResolvedValueOnce(f.verified());
    await f.service.verifyCode('viewer@example.com', '123456');
    f.fetcher.mockRejectedValue(new TypeError('offline'));
    await f.service.signOut();
    expect((await f.service.status()).kind).toBe('signed-out');
  });
});
