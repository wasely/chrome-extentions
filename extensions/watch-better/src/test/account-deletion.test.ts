// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('server account deletion', () => {
  let handler: (request: Request) => Promise<Response>;
  const fetcher = vi.fn<typeof fetch>();
  beforeAll(async () => {
    vi.stubGlobal('Deno', {
      serve: (callback: typeof handler) => {
        handler = callback;
      },
      env: {
        get: (name: string) =>
          name === 'SUPABASE_URL'
            ? 'https://example.supabase.co'
            : 'example-server-key',
      },
    });
    await import('../../supabase/functions/delete-account/index');
  });
  it('does not invoke admin deletion for invalid or unverified callers', async () => {
    vi.stubGlobal('fetch', fetcher);
    fetcher.mockReset();
    expect(
      (await handler(new Request('https://example.com', { method: 'POST' }))).status,
    ).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
    fetcher.mockResolvedValue(new Response('{}', { status: 401 }));
    expect(
      (
        await handler(
          new Request('https://example.com', {
            method: 'POST',
            headers: { Authorization: 'Bearer example-invalid' },
          }),
        )
      ).status,
    ).toBe(401);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('deletes only the verified caller, ignoring a supplied victim ID', async () => {
    vi.stubGlobal('fetch', fetcher);
    fetcher.mockReset();
    const id = '12345678-1234-1234-1234-123456789012';
    fetcher
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id, email_confirmed_at: '2026-09-09' })),
      )
      .mockResolvedValueOnce(new Response('{}'));
    const result = await handler(
      new Request('https://example.com', {
        method: 'POST',
        headers: { Authorization: 'Bearer example-verified' },
        body: JSON.stringify({ userId: 'another-person' }),
      }),
    );
    expect(result.status).toBe(200);
    expect(fetcher.mock.calls[1]?.[0]).toBe(
      `https://example.supabase.co/auth/v1/admin/users/${id}`,
    );
    expect(fetcher.mock.calls[1]?.[1]?.method).toBe('DELETE');
    expect(await result.text()).not.toContain('example-server-key');
  });
});
