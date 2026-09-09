import { useEffect, useState, type ReactNode } from 'react';
import { browser } from 'wxt/browser';
import { publicRequest, subscribePublicChanges } from '@/messaging/public-client';
import type { AuthStatus } from './auth-service';
import { AccountPanel } from './AccountPanel';
import { SettingsRepository } from '@/storage/settings-repository';

export function AccessGate({
  children,
  emailEntry = false,
  onLockedVisibilityChange,
  onClose,
}: {
  readonly children: ReactNode;
  readonly emailEntry?: boolean;
  readonly onLockedVisibilityChange?: (visible: boolean) => void;
  readonly onClose?: () => void;
}) {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [error, setError] = useState('');
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      void new SettingsRepository()
        .load()
        .then((settings) => {
          if (active) setEnabled(settings.extensionEnabled);
        })
        .catch(() => undefined);
      void publicRequest({ type: 'public:auth-status' })
        .then((next) => {
          if (active) {
            setStatus(next);
            setError('');
          }
        })
        .catch(() => {
          if (active) {
            setStatus({ kind: 'signed-out' });
            setError('Could not check access. Open settings to retry.');
          }
        });
    };
    refresh();
    const unsubscribe = subscribePublicChanges(refresh);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (status?.kind !== 'unlocked') onLockedVisibilityChange?.(enabled || emailEntry);
  }, [enabled, emailEntry, status?.kind, onLockedVisibilityChange]);
  if (!enabled && !emailEntry) return null;
  if (status?.kind === 'unlocked') return children;
  return (
    <div className="wb-access">
      {emailEntry && status ? (
        <AccountPanel
          initialStatus={status}
          onUnlocked={() => {
            void publicRequest({ type: 'public:auth-status' }).then(setStatus);
          }}
        />
      ) : (
        <section className="wb-account">
          <span className="wb-account__eyebrow">Watch Better</span>
          {onClose && (
            <button type="button" onClick={onClose}>
              Close
            </button>
          )}
          <h2>
            {status ? 'Enter your email. Unlock everything.' : 'Checking access…'}
          </h2>
          <p>
            {error ||
              'Enter your email in settings. No verification code or subscription.'}
          </p>
          <button
            className="wb-account__primary"
            type="button"
            onClick={() => {
              void browser.runtime
                .sendMessage({ type: 'settings:open' })
                .catch(() =>
                  setError('Open Watch Better options from Chrome’s extension menu.'),
                );
            }}
          >
            Open settings
          </button>
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
          <button
            type="button"
            onClick={() => {
              void browser.runtime
                .sendMessage({ type: 'runtime:set-enabled', enabled: false })
                .then((response: { ok?: boolean }) => {
                  if (response.ok) setEnabled(false);
                })
                .catch(() =>
                  setError('Use Chrome’s extension menu to disable Watch Better.'),
                );
            }}
          >
            Turn off Watch Better
          </button>
        </section>
      )}
    </div>
  );
}
