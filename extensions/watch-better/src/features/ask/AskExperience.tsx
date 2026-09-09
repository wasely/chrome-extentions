import { useState } from 'react';
import { browser } from 'wxt/browser';
import { publicRequest } from '@/messaging/public-client';
import { AskPanel, type AskPanelProps } from './AskPanel';
import { ApiChat } from './ApiChat';
import { useApiStatus } from './use-api-status';

export function AskExperience(props: AskPanelProps) {
  const status = useApiStatus();
  const enabled = Boolean(status?.configuration?.enabled);
  const [embeddedVisited, setEmbeddedVisited] = useState(false);
  const [apiVisited, setApiVisited] = useState(false);
  const [error, setError] = useState('');
  if (status && props.visible !== false) {
    if (enabled && !apiVisited) setApiVisited(true);
    if (!enabled && !embeddedVisited) setEmbeddedVisited(true);
  }
  const failed = Object.values(props.providerStatuses ?? {}).some(
    (value) => value.state === 'not-open' || value.state === 'sign-in-required',
  );
  return (
    <div className="ct-ask-experience" hidden={props.visible === false}>
      {status?.configuration && (
        <label className="ct-api-mode">
          AI connection
          <select
            value={enabled ? 'api' : 'embedded'}
            onChange={(event) => {
              void publicRequest({
                type: 'public:api-mode',
                enabled: event.target.value === 'api',
              }).catch((cause: unknown) =>
                setError(
                  cause instanceof Error
                    ? cause.message
                    : 'Could not switch connection.',
                ),
              );
            }}
          >
            <option value="embedded">ChatGPT / Gemini</option>
            <option value="api">Personal API</option>
          </select>
        </label>
      )}
      {error && <p role="alert">{error}</p>}
      {embeddedVisited && (
        <div className="ct-ask-experience__pane" hidden={enabled}>
          <AskPanel {...props} visible={props.visible !== false && !enabled} />
        </div>
      )}
      {enabled && !status?.connected && (
        <p role="status">
          Your session API key has expired. Reconnect it in Advanced settings or select
          ChatGPT / Gemini.
        </p>
      )}
      {apiVisited && status?.connected && (
        <div className="ct-ask-experience__pane" hidden={!enabled}>
          <ApiChat key={props.transcript?.videoId ?? 'empty'} {...props} />
        </div>
      )}
      {failed && !status?.connected && (
        <button
          type="button"
          onClick={() => {
            void browser.runtime.sendMessage({ type: 'settings:open' });
          }}
        >
          Advanced: connect your own API
        </button>
      )}
    </div>
  );
}
