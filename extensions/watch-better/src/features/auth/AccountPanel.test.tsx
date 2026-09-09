import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccountPanel } from './AccountPanel';
import type { AuthStatus } from './auth-service';

describe('email-only onboarding', () => {
  it('sends a code, accepts pasted digits, and unlocks after server verification', async () => {
    const user = userEvent.setup();
    const request = vi
      .fn()
      .mockResolvedValueOnce({ kind: 'signed-out' })
      .mockResolvedValueOnce({
        kind: 'verified',
        email: 'viewer@example.com',
        offline: false,
      } satisfies AuthStatus);
    const onVerified = vi.fn();
    render(
      <AccountPanel
        initialStatus={{ kind: 'signed-out' }}
        request={request}
        onVerified={onVerified}
      />,
    );
    await user.type(screen.getByLabelText('Email address'), 'viewer@example.com');
    await user.click(screen.getByRole('button', { name: 'Send code' }));
    expect(screen.getByRole('button', { name: /Resend in/ })).toBeDisabled();
    await user.type(screen.getByLabelText('Six-digit verification code'), '123456');
    await user.click(screen.getByRole('button', { name: 'Verify and unlock' }));
    expect(
      await screen.findByRole('heading', { name: 'You have full access' }),
    ).toBeVisible();
    expect(onVerified).toHaveBeenCalledOnce();
    expect(request).toHaveBeenLastCalledWith({
      type: 'public:verify-code',
      email: 'viewer@example.com',
      code: '123456',
    });
  });
  it('shows errors without unlocking and requires confirmation for deletion', async () => {
    const user = userEvent.setup();
    const request = vi.fn().mockRejectedValue(new Error('Email service unavailable.'));
    render(
      <AccountPanel
        initialStatus={{
          kind: 'verified',
          email: 'viewer@example.com',
          offline: false,
        }}
        request={request}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Delete account' }));
    expect(request).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Confirm deletion' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email service unavailable.',
    );
    expect(screen.getByRole('heading', { name: 'You have full access' })).toBeVisible();
  });
});
