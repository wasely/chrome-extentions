export const EMAIL_CONSENT_VERSION = '2026-09-09';

export interface EmailCollector {
  save(email: string, receipt: string): Promise<void>;
  remove(receipt: string): Promise<void>;
}

export function createEmailCollector(
  url: string,
  fetcher: typeof fetch = fetch,
): EmailCollector {
  const request = async (path: string, body: unknown): Promise<void> => {
    if (!/^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev$/.test(url))
      throw new Error(
        'Email collection is not configured yet. Please contact support.',
      );
    let result: Response;
    try {
      result = await fetcher(`${url}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'omit',
        redirect: 'error',
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new Error(
        'Could not reach email storage. Check your connection and retry.',
      );
    }
    if (!result.ok) {
      if (result.status === 429) throw new Error('Please wait a minute and try again.');
      throw new Error(
        path === '/remove'
          ? 'Could not confirm email deletion. Your saved access is kept so you can retry.'
          : 'Could not save your signup. Please retry shortly.',
      );
    }
    const value: unknown = await result.json();
    if (!value || typeof value !== 'object' || !('ok' in value) || value.ok !== true)
      throw new Error('Email storage did not confirm the request. Please retry.');
  };
  return {
    save: (email, receipt) =>
      request('/signup', {
        email,
        receipt,
        consent: true,
        consentVersion: EMAIL_CONSENT_VERSION,
      }),
    remove: (receipt) => request('/remove', { receipt }),
  };
}
