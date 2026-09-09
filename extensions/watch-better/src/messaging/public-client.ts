import { browser } from 'wxt/browser';
import type { AuthStatus } from '@/features/auth/auth-service';

export type PublicRequest =
  | { type: 'public:auth-status' }
  | { type: 'public:enter-email'; email: string; consent: boolean }
  | { type: 'public:sign-out' }
  | { type: 'public:api-status' }
  | { type: 'public:api-mode'; enabled: boolean }
  | { type: 'public:api-configure'; config: unknown; key: string; remember: boolean }
  | { type: 'public:api-disconnect' | 'public:api-test' | 'public:api-models' };

export async function publicRequest<T = AuthStatus>(
  request: PublicRequest,
): Promise<T> {
  const response: { ok: boolean; value?: T; message?: string } =
    await browser.runtime.sendMessage(request);
  if (!response?.ok || response.value === undefined)
    throw new Error(
      response?.message ?? 'Watch Better could not connect. Please retry.',
    );
  return response.value;
}

export function subscribePublicChanges(onChange: () => void): () => void {
  const listener = (message: unknown) => {
    if (
      message &&
      typeof message === 'object' &&
      'type' in message &&
      message.type === 'public:changed'
    )
      onChange();
  };
  browser.runtime.onMessage.addListener(listener);
  return () => browser.runtime.onMessage.removeListener(listener);
}
