import { useEffect, useId, useState } from 'react';
import { browser } from 'wxt/browser';
import {
  normalizeApiConfiguration,
  type ApiKind,
  type ApiStatus,
} from './api-provider';
import { publicRequest, subscribePublicChanges } from '@/messaging/public-client';
import '@/features/auth/AccountPanel.css';

export function ApiSettings() {
  const id = useId();
  const [kind, setKind] = useState<ApiKind>('gemini');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [model, setModel] = useState('');
  const [key, setKey] = useState('');
  const [remember, setRemember] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      void publicRequest<ApiStatus>({ type: 'public:api-status' })
        .then((next) => {
          if (!active) return;
          setStatus(next);
          if (next.configuration) {
            setKind(next.configuration.kind);
            setBaseUrl(next.configuration.baseUrl);
            setModel(next.configuration.model);
            setEnabled(next.configuration.enabled);
            setRemember(next.remembered);
          }
        })
        .catch(() => undefined);
    };
    refresh();
    const unsubscribe = subscribePublicChanges(refresh);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  const run = async (operation: () => Promise<void>) => {
    setBusy(true);
    setError(false);
    setMessage('');
    try {
      await operation();
    } catch (error) {
      setError(true);
      setMessage(error instanceof Error ? error.message : 'Could not connect.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <details className="wb-account">
      <summary>Advanced: personal API fallback</summary>
      <p>
        Optional. Signed-in ChatGPT/Gemini remain the normal experience. Your API
        provider may charge for requests.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          let config;
          try {
            config = normalizeApiConfiguration({ kind, baseUrl, model, enabled });
          } catch (error) {
            setError(true);
            setMessage(
              error instanceof Error ? error.message : 'Check the configuration.',
            );
            return;
          }
          const permission = browser.permissions.request({
            origins: [`${new URL(config.baseUrl).origin}/*`],
          });
          void run(async () => {
            if (!(await permission))
              throw new Error('API endpoint access was not granted.');
            const next = await publicRequest<ApiStatus>({
              type: 'public:api-configure',
              config,
              key,
              remember,
            });
            setStatus(next);
            setKey('');
            setMessage('API connected. Select Personal API in Ask to use it.');
          });
        }}
      >
        <label htmlFor={`${id}-kind`}>Provider protocol</label>
        <select
          id={`${id}-kind`}
          value={kind}
          onChange={(event) => {
            setKind(event.target.value as ApiKind);
            setModel('');
            if (event.target.value === 'openai-compatible')
              setBaseUrl('https://api.openai.com/v1');
          }}
        >
          <option value="gemini">Gemini</option>
          <option value="openai-compatible">OpenAI-compatible</option>
        </select>
        {kind === 'openai-compatible' ? (
          <>
            <label htmlFor={`${id}-url`}>API base URL</label>
            <input
              id={`${id}-url`}
              type="url"
              value={baseUrl}
              required
              onChange={(event) => setBaseUrl(event.target.value)}
            />
            <small>
              The key and requested transcript will be sent to this endpoint.
            </small>
          </>
        ) : null}
        <label htmlFor={`${id}-model`}>Model identifier</label>
        <input
          id={`${id}-model`}
          list={`${id}-models`}
          value={model}
          required
          maxLength={160}
          onChange={(event) => setModel(event.target.value)}
          placeholder="Enter a model from your provider"
        />
        <datalist id={`${id}-models`}>
          {models.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <label htmlFor={`${id}-key`}>API key</label>
        <input
          id={`${id}-key`}
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={key}
          required
          maxLength={4096}
          onChange={(event) => setKey(event.target.value)}
          placeholder={
            status?.connected
              ? 'Enter key again to change connection'
              : 'Your personal API key'
          }
        />
        <label>
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />{' '}
          Remember on this device
        </label>
        <small>
          Off: forget the key when Chrome closes or the extension reloads. Remembered
          keys stay in local extension storage, never sync.
        </small>
        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />{' '}
          Use Personal API for AI features
        </label>
        <button className="wb-account__primary" type="submit" disabled={busy}>
          {busy ? 'Working…' : 'Connect API'}
        </button>
      </form>
      {status?.connected ? (
        <div className="wb-account__actions">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(async () =>
                setMessage(await publicRequest<string>({ type: 'public:api-test' })),
              )
            }
          >
            Test connection (API usage)
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                setModels(await publicRequest<string[]>({ type: 'public:api-models' }));
                setMessage(
                  'Available models loaded. You can also enter a model manually.',
                );
              })
            }
          >
            List models
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                setStatus(
                  await publicRequest<ApiStatus>({ type: 'public:api-disconnect' }),
                );
                setMessage('API disconnected and key removed.');
              })
            }
          >
            Disconnect
          </button>
        </div>
      ) : null}
      {message ? <p role={error ? 'alert' : 'status'}>{message}</p> : null}
    </details>
  );
}
