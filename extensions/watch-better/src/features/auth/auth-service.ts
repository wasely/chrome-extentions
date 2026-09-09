import { EMAIL_CONSENT_VERSION, type EmailCollector } from './email-collector';
export interface AuthStorage {
  get(key: string): Promise<Record<string, unknown>>;
  set(values: Record<string, unknown>): Promise<void>;
  remove(key: string): Promise<void>;
}
export type AuthStatus =
  | { readonly kind: 'signed-out'; readonly pending?: boolean }
  | { readonly kind: 'unlocked'; readonly email: string };
const EMAIL_KEY = 'watchbetter:signup:v2';
interface SignupRecord {
  email: string;
  receipt: string;
  state: 'pending' | 'collected';
  consentVersion: string;
}
const LEGACY_KEYS = [
  'watchbetter:auth:v1',
  'watchbetter:auth-resend:v1',
  'watchbetter:email:v1',
];
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

/** Unverified signup collection. Receipts and emails remain in trusted background storage. */
export class AuthService {
  #legacyCleared = false;
  #pending: Promise<unknown> = Promise.resolve();
  constructor(
    private readonly storage: AuthStorage,
    private readonly collector: EmailCollector,
  ) {}

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

  async #load(): Promise<SignupRecord | null> {
    const value = (await this.storage.get(EMAIL_KEY))[EMAIL_KEY];
    if (!value || typeof value !== 'object') return null;
    const candidate = value as Partial<SignupRecord>;
    if (
      typeof candidate.receipt !== 'string' ||
      !/^[a-f0-9]{64}$/.test(candidate.receipt) ||
      !['pending', 'collected'].includes(candidate.state ?? '') ||
      candidate.consentVersion !== EMAIL_CONSENT_VERSION
    )
      return null;
    try {
      emailValue(candidate.email);
    } catch {
      return null;
    }
    return candidate as SignupRecord;
  }
  status(): Promise<AuthStatus> {
    return this.#serialize(async () => {
      await this.#clearLegacy();
      const record = await this.#load();
      return record?.state === 'collected'
        ? { kind: 'unlocked', email: record.email }
        : record
          ? { kind: 'signed-out', pending: true }
          : { kind: 'signed-out' };
    });
  }
  enterEmail(address: string, consent: boolean): Promise<AuthStatus> {
    return this.#serialize(async () => {
      if (consent !== true)
        throw new Error('Please agree to share your email before continuing.');
      const email = emailValue(address);
      await this.#clearLegacy();
      let record = await this.#load();
      if (record && record.email !== email)
        throw new Error(
          'Remove the previous signup before entering a different email.',
        );
      if (!record) {
        const receipt = Array.from(
          crypto.getRandomValues(new Uint8Array(32)),
          (value) => value.toString(16).padStart(2, '0'),
        ).join('');
        record = {
          email,
          receipt,
          state: 'pending',
          consentVersion: EMAIL_CONSENT_VERSION,
        };
        // Save the deletion receipt before sending; an interrupted request can be retried safely.
        await this.storage.set({ [EMAIL_KEY]: record });
      }
      if (record.state !== 'collected') {
        await this.collector.save(email, record.receipt);
        await this.storage.set({ [EMAIL_KEY]: { ...record, state: 'collected' } });
      }
      return { kind: 'unlocked', email };
    });
  }
  signOut(): Promise<void> {
    return this.#serialize(async () => {
      const record = await this.#load();
      if (record) await this.collector.remove(record.receipt);
      await this.storage.remove(EMAIL_KEY);
      await this.#clearLegacy();
    });
  }
}
