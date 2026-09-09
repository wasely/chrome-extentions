// Server only. The caller's JWT is verified against Auth before any admin action.
// verify_jwt=false avoids the gateway's legacy JWT-key restriction; do not remove
// the explicit /user verification below. No npm or remote executable imports.
declare const Deno: {
  serve(handler: (request: Request) => Promise<Response>): void;
  env: { get(name: string): string | undefined };
};
export {};
Deno.serve(async (request: Request) => {
  const reply = (status: number, message: string) =>
    new Response(JSON.stringify({ message }), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  if (request.method !== 'POST') return reply(405, 'Use POST.');
  const authorization = request.headers.get('authorization') ?? '';
  if (!/^Bearer \S+$/.test(authorization)) return reply(401, 'Sign in again.');
  const url = Deno.env.get('SUPABASE_URL');
  const adminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !adminKey) return reply(503, 'Account deletion is unavailable.');
  try {
    const userResponse = await fetch(`${url}/auth/v1/user`, {
      headers: new Headers([
        ['apikey', adminKey],
        ['Authorization', authorization],
      ]),
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
    if (!userResponse.ok) return reply(401, 'Sign in again.');
    const value: unknown = await userResponse.json();
    const user =
      value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
    if (
      typeof user.id !== 'string' ||
      !/^[a-f0-9-]{36}$/i.test(user.id) ||
      !user.email_confirmed_at
    )
      return reply(403, 'Verify your email first.');
    // Never accept a user ID from the request body, URL, or extension.
    const deleted = await fetch(
      `${url}/auth/v1/admin/users/${encodeURIComponent(user.id)}`,
      {
        method: 'DELETE',
        headers: new Headers([
          ['apikey', adminKey],
          ['Authorization', `Bearer ${adminKey}`],
        ]),
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
      },
    );
    return deleted.ok
      ? reply(200, 'Account deleted.')
      : reply(503, 'Could not delete your account. Try again.');
  } catch {
    return reply(503, 'Could not delete your account. Try again.');
  }
});
