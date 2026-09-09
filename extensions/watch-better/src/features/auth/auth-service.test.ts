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
  const collector = {
    save: vi
      .fn<(email: string, receipt: string) => Promise<void>>()
      .mockResolvedValue(undefined),
    remove: vi.fn<(receipt: string) => Promise<void>>().mockResolvedValue(undefined),
  };
  return { values, storage, collector, service: new AuthService(storage, collector) };
}
describe('consented private email collection', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('collects before unlocking, remembers access, and does not re-upload on restart', async () => {
    const fetcher = vi.fn(() => {
      throw new Error('offline');
    });
    vi.stubGlobal('fetch', fetcher);
    const f = fixture();
    expect(await f.service.status()).toEqual({ kind: 'signed-out' });
    expect(await f.service.enterEmail('  Viewer@Example.com  ', true)).toEqual({
      kind: 'unlocked',
      email: 'viewer@example.com',
    });
    expect(await new AuthService(f.storage, f.collector).status()).toEqual({
      kind: 'unlocked',
      email: 'viewer@example.com',
    });
    expect(fetcher).not.toHaveBeenCalled();
    expect(f.collector.save).toHaveBeenCalledOnce();
    expect(f.collector.save).toHaveBeenCalledWith(
      'viewer@example.com',
      expect.stringMatching(/^[a-f0-9]{64}$/),
    );
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
    await expect(f.service.enterEmail(email, true)).rejects.toThrow(/valid email/i);
    expect(await f.service.status()).toEqual({ kind: 'signed-out' });
    expect(f.values).toEqual({});
  });
  it('requires explicit consent and never uploads legacy local addresses', async () => {
    const f = fixture();
    f.values['watchbetter:email:v1'] = 'old@example.com';
    expect(await f.service.status()).toEqual({ kind: 'signed-out' });
    await expect(f.service.enterEmail('viewer@example.com', false)).rejects.toThrow(
      /agree/i,
    );
    expect(f.collector.save).not.toHaveBeenCalled();
  });
  it('keeps a pending receipt after a server failure and retries without duplicating it', async () => {
    const f = fixture();
    f.collector.save.mockRejectedValueOnce(new Error('offline'));
    await expect(f.service.enterEmail('viewer@example.com', true)).rejects.toThrow();
    expect(await f.service.status()).toEqual({ kind: 'signed-out', pending: true });
    const receipt = f.collector.save.mock.calls[0]?.[1];
    await f.service.enterEmail('viewer@example.com', true);
    expect(f.collector.save.mock.calls[1]?.[1]).toBe(receipt);
    expect((await f.service.status()).kind).toBe('unlocked');
  });
  it('retains the deletion receipt and access when server deletion fails', async () => {
    const f = fixture();
    await f.service.enterEmail('viewer@example.com', true);
    f.collector.remove.mockRejectedValueOnce(new Error('offline'));
    await expect(f.service.signOut()).rejects.toThrow();
    expect((await f.service.status()).kind).toBe('unlocked');
    await f.service.signOut();
    expect(await f.service.status()).toEqual({ kind: 'signed-out' });
  });
  it('removes email and legacy credentials locally', async () => {
    const f = fixture();
    f.values['watchbetter:auth:v1'] = { bearer: 'obsolete-fixture' };
    f.values['watchbetter:auth-resend:v1'] = { at: 1 };
    await f.service.enterEmail('viewer@example.com', true);
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
      f.service.enterEmail('viewer@example.com', true),
      f.service.signOut(),
    ]);
    expect(await f.service.status()).toEqual({ kind: 'signed-out' });
  });
});
