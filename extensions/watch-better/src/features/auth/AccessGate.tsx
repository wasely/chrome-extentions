import { useEffect, useState, type ReactNode } from 'react';
import { browser } from 'wxt/browser';
import { publicRequest, subscribePublicChanges } from '@/messaging/public-client';
import type { AuthStatus } from './auth-service';
import { AccountPanel } from './AccountPanel';
import { WatchBetterApp, type ResolvedTheme } from '@/app/WatchBetterApp';
import type { ThemePreference } from '@/features/settings/settings';
import { SettingsRepository } from '@/storage/settings-repository';

export function AccessGate({
  children,
  emailEntry = false,
  onLockedVisibilityChange,
  onClose,
  theme: suppliedTheme,
}: {
  readonly children: ReactNode;
  readonly theme?: ResolvedTheme;
  readonly emailEntry?: boolean;
  readonly onLockedVisibilityChange?: (visible: boolean) => void;
  readonly onClose?: () => void;
}) {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [error, setError] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const query = matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemTheme(query.matches ? 'dark' : 'light');
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const theme = suppliedTheme ?? (preference === 'system' ? systemTheme : preference);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void new SettingsRepository()
        .load()
        .then((settings) => {
          if (active) {
            setEnabled(settings.extensionEnabled);
            setPreference(settings.theme ?? 'system');
          }
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
    <div className="watchbetter-root wb-access" data-theme={theme}>
      <div className="wb-access__preview" inert aria-hidden="true">
        <WatchBetterApp theme={theme} preview />
      </div>
      <div className="wb-access__overlay">
        <div className="wb-access__content">
          {status ? (
            <AccountPanel
              initialStatus={status}
              inline
              onUnlocked={() => {
                void publicRequest({ type: 'public:auth-status' })
                  .then(setStatus)
                  .catch(() => setError('Could not check access. Please try again.'));
              }}
            />
          ) : (
            <p role="status">Checking access…</p>
          )}
          {error && <p role="alert">{error}</p>}
          <button
            className="wb-access__dismiss"
            type="button"
            onClick={() => {
              if (onClose) {
                onClose();
                return;
              }
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
            {onClose ? 'Close' : 'Turn off Watch Better'}
          </button>
        </div>
      </div>
    </div>
  );
}
