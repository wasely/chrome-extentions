// Harness only. Never import this adapter from production code.
import { AuthService } from '@/features/auth/auth-service';
const listeners = new Set<(message: unknown) => void>();
const values: Record<string, unknown> = {};
const access = new AuthService(
  {
    get: (key) => Promise.resolve({ [key]: values[key] }),
    set: (data) => {
      Object.assign(values, data);
      return Promise.resolve();
    },
    remove: (key) => {
      delete values[key];
      return Promise.resolve();
    },
  },
  { save: () => Promise.resolve(), remove: () => Promise.resolve() },
);
export const browser = {
  runtime: {
    sendMessage: async (request: {
      type: string;
      email?: string;
      consent?: boolean;
    }) => {
      if (request.type === 'public:auth-status')
        return { ok: true, value: await access.status() };
      if (request.type === 'public:enter-email' || request.type === 'public:sign-out') {
        const value =
          request.type === 'public:enter-email'
            ? await access.enterEmail(request.email ?? '', request.consent === true)
            : (await access.signOut(), await access.status());
        for (const listener of listeners) listener({ type: 'public:changed' });
        return { ok: true, value };
      }
      return {
        ok: true,
        value: { connected: false, configuration: null, remembered: false },
      };
    },
    onMessage: {
      addListener: (listener: (message: unknown) => void) => listeners.add(listener),
      removeListener: (listener: (message: unknown) => void) =>
        listeners.delete(listener),
    },
  },
  permissions: { request: () => Promise.resolve(false) },
};
