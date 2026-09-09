// Harness only. Never import this adapter from production code.
const listeners = new Set<() => void>();
export const browser = {
  runtime: {
    sendMessage: (request: { type: string }) =>
      Promise.resolve({
        ok: true,
        value:
          request.type === 'public:auth-status'
            ? { kind: 'signed-out' }
            : { connected: false, configuration: null, remembered: false },
      }),
    onMessage: {
      addListener: (listener: () => void) => listeners.add(listener),
      removeListener: (listener: () => void) => listeners.delete(listener),
    },
  },
  permissions: { request: () => Promise.resolve(false) },
};
