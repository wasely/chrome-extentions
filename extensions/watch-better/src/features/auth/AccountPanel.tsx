import { useEffect, useId, useState } from 'react';
import type { AuthStatus } from './auth-service';
import {
  publicRequest,
  subscribePublicChanges,
  type PublicRequest,
} from '@/messaging/public-client';
import { BrandLogo } from '@/components/BrandLogo';
import { Icon } from '@/components/Icon';
import './AccountPanel.css';

export interface AccountPanelProps {
  readonly initialStatus?: AuthStatus;
  readonly inline?: boolean;
  readonly request?: (request: PublicRequest) => Promise<AuthStatus>;
  readonly onUnlocked?: () => void;
}
export function AccountPanel({
  initialStatus,
  inline = false,
  request = publicRequest,
  onUnlocked,
}: AccountPanelProps) {
  const id = useId();
  const [status, setStatus] = useState<AuthStatus | null>(initialStatus ?? null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  useEffect(() => {
    if (initialStatus) return;
    let active = true;
    const refresh = () => {
      void request({ type: 'public:auth-status' })
        .then((next) => {
          if (active) setStatus(next);
        })
        .catch(() => {
          if (active) {
            setError(true);
            setMessage('Could not check access. Close and reopen this page to retry.');
          }
        });
    };
    refresh();
    const unsubscribe = subscribePublicChanges(refresh);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [initialStatus, request]);

  const act = async (operation: PublicRequest) => {
    setBusy(true);
    setError(false);
    setMessage('');
    try {
      const next = await request(operation);
      if (operation.type === 'public:enter-email' && next.kind !== 'unlocked')
        throw new Error('Could not save email. Please try again.');
      setStatus(next);
      setEmail('');
      if (next.kind === 'unlocked') onUnlocked?.();
      else setMessage('Your signup email has been deleted.');
    } catch (failure) {
      void request({ type: 'public:auth-status' })
        .then(setStatus)
        .catch(() => undefined);
      setError(true);
      setMessage(
        failure instanceof Error
          ? failure.message
          : 'Could not complete that action. Try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className={`wb-account${status?.kind === 'unlocked' ? ' wb-account--unlocked' : ''}`}
      aria-labelledby={`${id}-title`}
    >
      {status?.kind !== 'unlocked' && (
        <div className="wb-account__brand">
          <BrandLogo />
          <span>Watch Better</span>
        </div>
      )}
      <h2 id={`${id}-title`}>
        {status?.kind === 'unlocked'
          ? 'Full access'
          : 'Enter your email to get started.'}
      </h2>
      {status === null ? (
        <p role="status">Checking access…</p>
      ) : status.kind === 'unlocked' ? (
        <>
          <p>{status.email}</p>
          <div className="wb-account__actions">
            <button
              type="button"
              disabled={busy}
              title="Delete your signup and reset access"
              onClick={() => void act({ type: 'public:sign-out' })}
            >
              {busy ? 'Please wait…' : 'Remove email'}
            </button>
          </div>
        </>
      ) : (
        <>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!busy) void act({ type: 'public:enter-email', email, consent: true });
            }}
          >
            <label className="wb-account__sr-only" htmlFor={`${id}-email`}>
              Email address
            </label>
            <div className="wb-account__entry">
              <input
                id={`${id}-email`}
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                aria-describedby={`${id}-disclosure`}
                required
                maxLength={254}
                value={email}
                disabled={busy}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
              <button
                className="wb-account__primary"
                type="submit"
                disabled={busy}
                aria-label="Continue"
                title="Continue (Enter)"
              >
                {busy ? '…' : <Icon name="arrow-right" />}
              </button>
            </div>
          </form>
          <small id={`${id}-disclosure`}>
            By continuing, you agree to let Watch Better collect your email for signup.
            No verification. No marketing emails.
          </small>
        </>
      )}
      {!inline && status?.kind === 'signed-out' && status.pending ? (
        <button
          type="button"
          disabled={busy}
          title="Delete your signup and reset access"
          onClick={() => void act({ type: 'public:sign-out' })}
        >
          Remove pending signup
        </button>
      ) : null}
      {message ? (
        <p
          role={error ? 'alert' : 'status'}
          className={error ? 'wb-account__error' : ''}
        >
          {message}
        </p>
      ) : null}
      <footer>
        <a
          href="https://github.com/wasely/chrome-extentions/blob/main/extensions/watch-better/PRIVACY.md"
          target="_blank"
          rel="noreferrer"
        >
          Privacy
        </a>
        {!inline && (
          <a
            href="https://github.com/wasely/chrome-extentions/issues"
            target="_blank"
            rel="noreferrer"
          >
            Support
          </a>
        )}
      </footer>
    </section>
  );
}
