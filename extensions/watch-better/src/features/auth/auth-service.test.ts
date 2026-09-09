import { afterEach, describe, expect, it, vi } from 'vitest';
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
  return { values, storage, service: new AuthService(storage) };
}
describe('local email access', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('unlocks immediately, survives a restart, and never calls a server', async () => {
    const fetcher = vi.fn(() => {
      throw new Error('offline');
    });
    vi.stubGlobal('fetch', fetcher);
    const f = fixture();
    expect(await f.service.status()).toEqual({ kind: 'signed-out' });
    expect(await f.service.enterEmail('  Viewer@Example.com  ')).toEqual({
      kind: 'unlocked',
      email: 'viewer@example.com',
    });
    expect(await new AuthService(f.storage).status()).toEqual({
      kind: 'unlocked',
      email: 'viewer@example.com',
    });
    expect(fetcher).not.toHaveBeenCalled();
    expect(f.values).toEqual({ 'watchbetter:email:v1': 'viewer@example.com' });
  });
  it.each([
    '',
    'bad',
    'a@b',
    'a b@example.com',
    'a\u0000@example.com',
    'a'.repeat(250) + '@example.com',
  ])('rejects invalid email %j', async (email) => {
    const f = fixture();
    await expect(f.service.enterEmail(email)).rejects.toThrow(/valid email/i);
    expect(await f.service.status()).toEqual({ kind: 'signed-out' });
    expect(f.values).toEqual({});
  });
  it('removes email and legacy credentials locally', async () => {
    const f = fixture();
    f.values['watchbetter:auth:v1'] = { bearer: 'obsolete-fixture' };
    f.values['watchbetter:auth-resend:v1'] = { at: 1 };
    await f.service.enterEmail('viewer@example.com');
    await f.service.signOut();
    expect(f.values).toEqual({});
    expect(await f.service.status()).toEqual({ kind: 'signed-out' });
  });
  it('does not trust corrupt stored data or reuse old authentication', async () => {
    const f = fixture();
    f.values['watchbetter:email:v1'] = { email: 'viewer@example.com' };
    f.values['watchbetter:auth:v1'] = { email: 'old@example.com', bearer: 'obsolete' };
    expect(await f.service.status()).toEqual({ kind: 'signed-out' });
    expect(f.values['watchbetter:auth:v1']).toBeUndefined();
  });
  it('serializes removal after a pending email write', async () => {
    const f = fixture();
    await Promise.all([
      f.service.enterEmail('viewer@example.com'),
      f.service.signOut(),
    ]);
    expect(await f.service.status()).toEqual({ kind: 'signed-out' });
  });
});
