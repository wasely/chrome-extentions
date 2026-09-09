import { browser } from 'wxt/browser';
import type { ApiMessage } from './api-provider';

export function streamApiAnswer(
  videoId: string,
  sessionId: string,
  messages: readonly ApiMessage[],
  signal: AbortSignal,
  onDelta: (delta: string) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('Request cancelled.'));
      return;
    }
    const requestId = crypto.randomUUID();
    const port = browser.runtime.connect({ name: 'watchbetter:api:v1' });
    let settled = false;
    const finish = (error?: Error, text = '') => {
      if (settled) return;
      settled = true;
      signal.removeEventListener('abort', cancel);
      port.disconnect();
      if (error) reject(error);
      else resolve(text);
    };
    const cancel = () => {
      try {
        port.postMessage({ type: 'cancel' });
      } finally {
        finish(new Error('Request stopped.'));
      }
    };
    signal.addEventListener('abort', cancel, { once: true });
    port.onDisconnect.addListener(() =>
      finish(
        new Error(
          'Connection interrupted. Your partial answer is kept; retry when ready.',
        ),
      ),
    );
    port.onMessage.addListener((value: unknown) => {
      if (!value || typeof value !== 'object') return;
      const message = value as Record<string, unknown>;
      if (message.requestId !== requestId) return;
      if (message.type === 'delta' && typeof message.delta === 'string')
        onDelta(message.delta);
      if (message.type === 'complete' && typeof message.text === 'string')
        finish(undefined, message.text);
      if (message.type === 'error')
        finish(
          new Error(
            typeof message.message === 'string'
              ? message.message
              : 'AI request failed.',
          ),
        );
    });
    port.postMessage({ type: 'start', requestId, videoId, sessionId, messages });
  });
}
