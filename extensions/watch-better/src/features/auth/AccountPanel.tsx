import { useEffect, useId, useState } from 'react';
import type { AuthStatus } from './auth-service';
import {
  publicRequest,
  subscribePublicChanges,
  type PublicRequest,
} from '@/messaging/public-client';
import './AccountPanel.css';

export interface AccountPanelProps {
  readonly initialStatus?: AuthStatus;
  readonly request?: (request: PublicRequest) => Promise<AuthStatus>;
  readonly onUnlocked?: () => void;
}
export function AccountPanel({
  initialStatus,
  request = publicRequest,
  onUnlocked,
}: AccountPanelProps) {
  const id = useId();
  const [status, setStatus] = useState<AuthStatus | null>(initialStatus ?? null);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
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
      setConsent(false);
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
    <section className="wb-account" aria-labelledby={`${id}-title`}>
      <span className="wb-account__eyebrow">Watch Better</span>
      <h2 id={`${id}-title`}>
        {status?.kind === 'unlocked'
          ? 'You have full access'
          : 'Your email. Full access.'}
      </h2>
      {status === null ? (
        <p role="status">Checking access…</p>
      ) : status.kind === 'unlocked' ? (
        <>
          <p>{status.email}</p>
          <p>
            Your signup email is stored privately in GitHub. Remove it to delete your
            signup, reset access, and disconnect personal APIs.
          </p>
          <div className="wb-account__actions">
            <button
              type="button"
              disabled={busy}
              onClick={() => void act({ type: 'public:sign-out' })}
            >
              {busy ? 'Please wait…' : 'Remove email'}
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            Enter your email to unlock every feature. No verification code, password, or
            subscription.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void act({ type: 'public:enter-email', email, consent });
            }}
          >
            <label htmlFor={`${id}-email`}>Email address</label>
            <input
              id={`${id}-email`}
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              disabled={busy}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
            <label className="wb-account__consent">
              <input
                type="checkbox"
                required
                checked={consent}
                disabled={busy}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <span>
                I agree to share my email with Watch Better for signup records.
              </span>
            </label>
            <button className="wb-account__primary" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : 'Continue'}
            </button>
          </form>
          <small>
            Your email is sent securely through Cloudflare and stored privately in
            GitHub for up to one year. No verification or marketing emails.
          </small>
        </>
      )}
      {status?.kind === 'signed-out' && status.pending ? (
        <button
          type="button"
          disabled={busy}
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
        <a
          href="https://github.com/wasely/chrome-extentions/issues"
          target="_blank"
          rel="noreferrer"
        >
          Support
        </a>
      </footer>
    </section>
  );
}
