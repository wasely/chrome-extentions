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
  readonly onVerified?: () => void;
}

export function AccountPanel({
  initialStatus,
  request = publicRequest,
  onVerified,
}: AccountPanelProps) {
  const id = useId();
  const [status, setStatus] = useState<AuthStatus | null>(initialStatus ?? null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
            setMessage('Could not check sign-in. Close and reopen this page to retry.');
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

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(
      () => setCooldown((remaining) => Math.max(0, remaining - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const act = async (operation: PublicRequest) => {
    setBusy(true);
    setError(false);
    setMessage('');
    try {
      const next = await request(operation);
      if (operation.type === 'public:send-code') {
        setSent(true);
        setCooldown(60);
        setMessage('Code sent. Check your inbox and spam folder.');
      } else if (operation.type === 'public:verify-code') {
        setStatus(next);
        setCode('');
        setMessage('You have full access.');
        onVerified?.();
      } else {
        setStatus({ kind: 'signed-out' });
        setSent(false);
        setConfirmDelete(false);
        setMessage(
          operation.type === 'public:delete-account'
            ? 'Your account has been deleted.'
            : 'Signed out.',
        );
      }
    } catch (failure) {
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
        {status?.kind === 'verified'
          ? 'You have full access'
          : 'Your email. Full access.'}
      </h2>
      {status === null ? (
        <p role="status">Checking sign-in…</p>
      ) : status.kind === 'unconfigured' ? (
        <p role="status">Email sign-in is not available yet. Please contact support.</p>
      ) : status.kind === 'verified' ? (
        <>
          <p>{status.email}</p>
          {status.offline ? (
            <p>Offline access is active. We’ll reconnect automatically.</p>
          ) : null}
          <div className="wb-account__actions">
            <button
              type="button"
              disabled={busy}
              onClick={() => void act({ type: 'public:sign-out' })}
            >
              Sign out
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
            >
              Delete account
            </button>
          </div>
          {confirmDelete ? (
            <div role="group" aria-label="Confirm account deletion">
              <p>Delete your account and sign out? This cannot be undone.</p>
              <div className="wb-account__actions">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void act({ type: 'public:delete-account' })}
                >
                  Confirm deletion
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmDelete(false)}
                >
                  Keep account
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <p>
            Verify your email once to unlock every feature. No password or subscription.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void act(
                sent
                  ? { type: 'public:verify-code', email, code }
                  : { type: 'public:send-code', email },
              );
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
              disabled={busy || sent}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
            {sent ? (
              <>
                <label htmlFor={`${id}-code`}>Six-digit verification code</label>
                <input
                  id={`${id}-code`}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  disabled={busy}
                />
                <small>
                  Sent by Watch Better from login@auth.syncmedia.shop. Expires after 10
                  minutes.
                </small>
              </>
            ) : null}
            <button className="wb-account__primary" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : sent ? 'Verify and unlock' : 'Send code'}
            </button>
          </form>
          {sent ? (
            <div className="wb-account__actions">
              <button
                disabled={busy || cooldown > 0}
                type="button"
                onClick={() => void act({ type: 'public:send-code', email })}
              >
                {cooldown ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
              <button
                disabled={busy}
                type="button"
                onClick={() => {
                  setSent(false);
                  setCode('');
                  setMessage('');
                }}
              >
                Change email
              </button>
            </div>
          ) : null}
          <small>Your email is used for access. No marketing emails.</small>
        </>
      )}
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
