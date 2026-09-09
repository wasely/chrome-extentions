export interface AuthStorage {
  get(key: string): Promise<Record<string, unknown>>;
  set(values: Record<string, unknown>): Promise<void>;
  remove(key: string): Promise<void>;
}
export type AuthStatus =
  | { readonly kind: 'signed-out' }
  | { readonly kind: 'unlocked'; readonly email: string };
const EMAIL_KEY = 'watchbetter:email:v1';
const LEGACY_KEYS = ['watchbetter:auth:v1', 'watchbetter:auth-resend:v1'];
const emailValue = (value: unknown): string => {
  if (typeof value !== 'string') throw new Error('Enter a valid email address.');
  const email = value.trim().toLowerCase();
  if (
    email.length > 254 ||
    [...email].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  )
    throw new Error('Enter a valid email address.');
  return email;
};

/** Local onboarding only: an entered email is not proof of identity.
 * Background-only storage; no account service, tokens, or network requests.
 */
export class AuthService {
  #legacyCleared = false;
  #pending: Promise<unknown> = Promise.resolve();
  constructor(private readonly storage: AuthStorage) {}

  #serialize<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.#pending.then(operation);
    this.#pending = next.catch(() => undefined);
    return next;
  }

  async #clearLegacy(): Promise<void> {
    if (this.#legacyCleared) return;
    for (const key of LEGACY_KEYS) await this.storage.remove(key);
    this.#legacyCleared = true;
  }

  status(): Promise<AuthStatus> {
    return this.#serialize(async () => {
      await this.#clearLegacy();
      const candidate = (await this.storage.get(EMAIL_KEY))[EMAIL_KEY];
      try {
        return { kind: 'unlocked', email: emailValue(candidate) };
      } catch {
        return { kind: 'signed-out' };
      }
    });
  }

  enterEmail(address: string): Promise<AuthStatus> {
    return this.#serialize(async () => {
      const email = emailValue(address);
      await this.#clearLegacy();
      await this.storage.set({ [EMAIL_KEY]: email });
      return { kind: 'unlocked', email };
    });
  }

  signOut(): Promise<void> {
    return this.#serialize(async () => {
      await this.storage.remove(EMAIL_KEY);
      await this.#clearLegacy();
    });
  }
}
