import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccountPanel } from './AccountPanel';
describe('email-only onboarding', () => {
  it('unlocks with one email submission and no code step', async () => {
    const user = userEvent.setup();
    const request = vi
      .fn()
      .mockResolvedValue({ kind: 'unlocked', email: 'viewer@example.com' });
    const onUnlocked = vi.fn();
    render(
      <AccountPanel
        initialStatus={{ kind: 'signed-out' }}
        request={request}
        onUnlocked={onUnlocked}
      />,
    );
    expect(screen.getByText(/stored privately in GitHub/i)).toBeVisible();
    await user.type(screen.getByLabelText('Email address'), 'viewer@example.com');
    await user.click(
      screen.getByRole('checkbox', { name: /agree to share my email/i }),
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(
      await screen.findByRole('heading', { name: 'You have full access' }),
    ).toBeVisible();
    expect(screen.queryByLabelText(/code/i)).toBeNull();
    expect(onUnlocked).toHaveBeenCalledOnce();
    expect(request).toHaveBeenCalledExactlyOnceWith({
      type: 'public:enter-email',
      email: 'viewer@example.com',
      consent: true,
    });
  });
  it('keeps email entry available after a storage failure', async () => {
    const user = userEvent.setup();
    const request = vi.fn().mockRejectedValue(new Error('Could not save email.'));
    const onUnlocked = vi.fn();
    render(
      <AccountPanel
        initialStatus={{ kind: 'signed-out' }}
        request={request}
        onUnlocked={onUnlocked}
      />,
    );
    await user.type(screen.getByLabelText('Email address'), 'viewer@example.com');
    await user.click(
      screen.getByRole('checkbox', { name: /agree to share my email/i }),
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save email.');
    expect(onUnlocked).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });
  it('removes the local email and returns to entry', async () => {
    const user = userEvent.setup();
    const request = vi.fn().mockResolvedValue({ kind: 'signed-out' });
    render(
      <AccountPanel
        initialStatus={{ kind: 'unlocked', email: 'viewer@example.com' }}
        request={request}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Remove email' }));
    expect(await screen.findByLabelText('Email address')).toBeVisible();
    expect(screen.queryByText('viewer@example.com')).toBeNull();
    expect(request).toHaveBeenCalledExactlyOnceWith({ type: 'public:sign-out' });
  });
});
