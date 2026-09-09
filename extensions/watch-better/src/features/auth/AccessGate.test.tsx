import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccessGate } from './AccessGate';
const state = vi.hoisted(() => ({
  request: vi.fn(),
  changed: (): void => undefined,
}));
vi.mock('@/messaging/public-client', () => ({
  publicRequest: state.request,
  subscribePublicChanges: (callback: () => void) => {
    state.changed = callback;
    return () => undefined;
  },
}));
vi.mock('@/storage/settings-repository', () => ({
  SettingsRepository: class {
    load() {
      return Promise.resolve({ extensionEnabled: true });
    }
  },
}));

describe('feature access gate', () => {
  beforeEach(() => {
    state.request.mockReset();
  });
  it('fails closed while loading, when unconfigured, and after a network error', async () => {
    state.request.mockResolvedValue({ kind: 'unconfigured' });
    const visible = vi.fn();
    render(
      <AccessGate onLockedVisibilityChange={visible}>
        <button>Protected feature</button>
      </AccessGate>,
    );
    expect(screen.queryByText('Protected feature')).toBeNull();
    await screen.findByText(/Email sign-in is not available/);
    expect(visible).toHaveBeenCalledWith(true);
    expect(screen.getByRole('link', { name: 'Privacy' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Turn off Watch Better' })).toBeVisible();
    state.request.mockRejectedValue(new Error('offline'));
    await act(async () => {
      state.changed();
      await Promise.resolve();
    });
    expect(screen.queryByText('Protected feature')).toBeNull();
  });
  it('mounts features only after verification and unmounts on logout', async () => {
    state.request.mockResolvedValue({ kind: 'signed-out' });
    render(
      <AccessGate>
        <button>Protected feature</button>
      </AccessGate>,
    );
    await screen.findByText('Verify your email. Unlock everything.');
    state.request.mockResolvedValue({ kind: 'verified', email: '', offline: false });
    await act(async () => {
      state.changed();
      await Promise.resolve();
    });
    expect(screen.getByText('Protected feature')).toBeVisible();
    state.request.mockResolvedValue({ kind: 'signed-out' });
    await act(async () => {
      state.changed();
      await Promise.resolve();
    });
    await waitFor(() => expect(screen.queryByText('Protected feature')).toBeNull());
  });
});
