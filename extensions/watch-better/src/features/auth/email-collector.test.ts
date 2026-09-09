import { describe, expect, it, vi } from 'vitest';
import { createEmailCollector } from './email-collector';
describe('email collection transport', () => {
  it('uses HTTPS JSON without cookies, GitHub keys, or redirects', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ ok: true }));
    await createEmailCollector('https://collector.example.workers.dev', fetcher).save(
      'viewer@example.com',
      'a'.repeat(64),
    );
    const [url, options] = fetcher.mock.calls[0]!;
    expect(url).toBe('https://collector.example.workers.dev/signup');
    expect(options).toMatchObject({
      credentials: 'omit',
      redirect: 'error',
      method: 'POST',
    });
    expect(options?.headers).toEqual({ 'Content-Type': 'application/json' });
    if (typeof options?.body !== 'string') throw new Error('Expected JSON body');
    expect(JSON.parse(options.body)).toMatchObject({
      consent: true,
      email: 'viewer@example.com',
    });
  });
  it('does not clear a receipt when the server cannot confirm deletion', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('{}', { status: 503 }));
    await expect(
      createEmailCollector('https://collector.example.workers.dev', fetcher).remove(
        'a'.repeat(64),
      ),
    ).rejects.toThrow(/deletion/i);
  });
  it('rejects missing or unsafe endpoint configuration without a request', async () => {
    const fetcher = vi.fn<typeof fetch>();
    for (const url of ['', 'http://localhost', 'https://evil.example'])
      await expect(
        createEmailCollector(url, fetcher).save('viewer@example.com', 'a'.repeat(64)),
      ).rejects.toThrow(/configured/i);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
