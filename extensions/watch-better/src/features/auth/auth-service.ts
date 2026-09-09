export interface AuthConfig {
  readonly url: string;
  readonly publishableKey: string;
}
export interface AuthStorage {
  get(key: string): Promise<Record<string, unknown>>;
  set(values: Record<string, unknown>): Promise<void>;
  remove(key: string): Promise<void>;
}
export type AuthStatus =
  | { readonly kind: 'unconfigured' | 'signed-out' }
  | { readonly kind: 'verified'; readonly email: string; readonly offline: boolean };
interface Session {
  bearer: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
  userId: string;
  lastVerifiedAt: number;
}
const SESSION_KEY = 'watchbetter:auth:v1';
const RESEND_KEY = 'watchbetter:auth-resend:v1';
const OFFLINE_GRACE = 7 * 86400_000;
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const emailValue = (value: string): string => {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error('Enter a valid email address.');
  return email;
};
class AuthHttpError extends Error {
  constructor(readonly status: number) {
    super('Authentication request failed.');
  }
}

/** Background-only: returns public status, never authentication credentials. */
export class AuthService {
  #pendingStatus: Promise<AuthStatus> | null = null;
  #epoch = 0;
  constructor(
    private readonly config: AuthConfig,
    private readonly storage: AuthStorage,
    private readonly fetcher: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
  ) {}

  get configured(): boolean {
    return (
      /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(this.config.url) &&
      this.config.publishableKey.length > 0
    );
  }

  async #request(path: string, body?: unknown, token?: string): Promise<unknown> {
    if (!this.configured)
      throw new Error('Email sign-in is not configured yet. Please contact support.');
    const headers = new Headers({ 'Content-Type': 'application/json' });
    headers.set('apikey', this.config.publishableKey);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await this.fetcher(`${this.config.url}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      redirect: 'error',
      credentials: 'omit',
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new AuthHttpError(response.status);
    if (response.status === 204) return {};
    const text = await response.text();
    return text ? (JSON.parse(text) as unknown) : {};
  }

  async #load(): Promise<Session | null> {
    const candidate = record((await this.storage.get(SESSION_KEY))[SESSION_KEY]);
    return typeof candidate.bearer === 'string' &&
      typeof candidate.refreshToken === 'string' &&
      typeof candidate.email === 'string' &&
      typeof candidate.userId === 'string' &&
      typeof candidate.expiresAt === 'number' &&
      Number.isFinite(candidate.expiresAt) &&
      typeof candidate.lastVerifiedAt === 'number' &&
      Number.isFinite(candidate.lastVerifiedAt)
      ? (candidate as unknown as Session)
      : null;
  }

  async #saveResponse(value: unknown, epoch: number): Promise<AuthStatus> {
    const response = record(value);
    const user = record(response.user);
    if (
      typeof response.access_token !== 'string' ||
      typeof response.refresh_token !== 'string' ||
      typeof response.expires_in !== 'number' ||
      !Number.isFinite(response.expires_in) ||
      response.expires_in <= 0 ||
      typeof user.id !== 'string' ||
      typeof user.email !== 'string' ||
      typeof user.email_confirmed_at !== 'string'
    )
      throw new Error('Email verification was not confirmed. Request a new code.');
    if (epoch !== this.#epoch) throw new Error('This sign-in was cancelled.');
    const session: Session = {
      bearer: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: this.now() + response.expires_in * 1000,
      email: user.email,
      userId: user.id,
      lastVerifiedAt: this.now(),
    };
    await this.storage.set({ [SESSION_KEY]: session });
    if (epoch !== this.#epoch) throw new Error('This sign-in was cancelled.');
    return { kind: 'verified', email: session.email, offline: false };
  }

  status(): Promise<AuthStatus> {
    if (!this.#pendingStatus)
      this.#pendingStatus = this.#status().finally(() => {
        this.#pendingStatus = null;
      });
    return this.#pendingStatus;
  }

  async #status(): Promise<AuthStatus> {
    if (!this.configured) return { kind: 'unconfigured' };
    const epoch = this.#epoch;
    const session = await this.#load();
    if (epoch !== this.#epoch) return { kind: 'signed-out' };
    if (!session) return { kind: 'signed-out' };
    if (
      session.expiresAt > this.now() + 60_000 &&
      this.now() - session.lastVerifiedAt < 300_000
    )
      return { kind: 'verified', email: session.email, offline: false };
    try {
      if (session.expiresAt <= this.now() + 60_000) {
        const result = await this.#request('/auth/v1/token?grant_type=refresh_token', {
          refresh_token: session.refreshToken,
        });
        return await this.#saveResponse(result, epoch);
      }
      const user = record(
        await this.#request('/auth/v1/user', undefined, session.bearer),
      );
      if (user.id !== session.userId || typeof user.email_confirmed_at !== 'string')
        throw new AuthHttpError(401);
      if (epoch !== this.#epoch) return { kind: 'signed-out' };
      session.lastVerifiedAt = this.now();
      await this.storage.set({ [SESSION_KEY]: session });
      if (epoch !== this.#epoch) return { kind: 'signed-out' };
      return { kind: 'verified', email: session.email, offline: false };
    } catch (error) {
      if (epoch !== this.#epoch) return { kind: 'signed-out' };
      if (
        error instanceof AuthHttpError &&
        [400, 401, 403, 422].includes(error.status)
      ) {
        await this.storage.remove(SESSION_KEY);
        return { kind: 'signed-out' };
      }
      if (
        (error instanceof TypeError ||
          error instanceof DOMException ||
          (error instanceof AuthHttpError && error.status >= 429)) &&
        this.now() >= session.lastVerifiedAt &&
        this.now() - session.lastVerifiedAt <= OFFLINE_GRACE
      )
        return { kind: 'verified', email: session.email, offline: true };
      return { kind: 'signed-out' };
    }
  }

  async requestCode(address: string): Promise<void> {
    const email = emailValue(address);
    const previous = record((await this.storage.get(RESEND_KEY))[RESEND_KEY]);
    if (typeof previous.at === 'number' && this.now() - previous.at < 60_000)
      throw new Error('Please wait 60 seconds before requesting another code.');
    await this.storage.set({ [RESEND_KEY]: { at: this.now() } });
    try {
      await this.#request('/auth/v1/otp', { email, create_user: true });
    } catch (error) {
      throw this.#friendly(error);
    }
  }

  async verifyCode(address: string, code: string): Promise<AuthStatus> {
    const email = emailValue(address);
    if (!/^\d{6}$/.test(code.trim()))
      throw new Error('Enter the six-digit code from your email.');
    const epoch = this.#epoch;
    try {
      return await this.#saveResponse(
        await this.#request('/auth/v1/verify', {
          email,
          token: code.trim(),
          type: 'email',
        }),
        epoch,
      );
    } catch (error) {
      throw this.#friendly(error);
    }
  }

  async signOut(): Promise<void> {
    this.#epoch += 1;
    const session = await this.#load();
    await this.storage.remove(SESSION_KEY);
    if (session)
      await this.#request('/auth/v1/logout?scope=local', {}, session.bearer).catch(
        () => undefined,
      );
  }

  async deleteAccount(): Promise<void> {
    const status = await this.status();
    const session = await this.#load();
    if (status.kind !== 'verified' || status.offline || !session)
      throw new Error(
        'Connect to the internet and sign in before deleting your account.',
      );
    try {
      await this.#request('/functions/v1/delete-account', {}, session.bearer);
    } catch {
      throw new Error(
        'Could not confirm account deletion. Reconnect and check again or contact support.',
      );
    }
    this.#epoch += 1;
    await this.storage.remove(SESSION_KEY);
    await this.storage.remove(RESEND_KEY);
  }

  #friendly(error: unknown): Error {
    if (error instanceof AuthHttpError) {
      if (error.status === 429)
        return new Error('Too many requests. Wait a moment and try again.');
      if (error.status >= 500)
        return new Error(
          'Email service is temporarily unavailable. Please try again shortly.',
        );
      return new Error(
        'That code is invalid or expired. Check it or request a new one.',
      );
    }
    if (error instanceof TypeError || error instanceof DOMException)
      return new Error('Could not connect. Check your internet connection and retry.');
    return error instanceof Error
      ? error
      : new Error('Could not sign in. Please try again.');
  }
}
