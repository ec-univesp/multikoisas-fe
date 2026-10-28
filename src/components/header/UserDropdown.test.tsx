import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import UserDropdown from './UserDropdown';

const { logoutAction } = vi.hoisted(() => ({ logoutAction: vi.fn() }));

vi.mock('@/features/admin-auth/actions', () => ({ loginAction: vi.fn(), logoutAction }));

describe('UserDropdown', () => {
  it('signs out through a form submit button', async () => {
    const user = userEvent.setup();
    const { container } = render(<UserDropdown />);

    await user.click(container.querySelector('.dropdown-toggle') as HTMLButtonElement);

    const signOutButton = screen.getByRole('button', { name: 'Sair' });
    expect(signOutButton).toHaveAttribute('type', 'submit');
    expect(signOutButton.closest('form')).not.toBeNull();
    expect(screen.queryByRole('link', { name: /sign out/i })).not.toBeInTheDocument();
  });

  it('calls the logout action when "Sair" is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<UserDropdown />);

    await user.click(container.querySelector('.dropdown-toggle') as HTMLButtonElement);
    await user.click(screen.getByRole('button', { name: 'Sair' }));

    expect(logoutAction).toHaveBeenCalledTimes(1);
  });

  it('offers only the sign-out action, without links to the template demo pages', async () => {
    const user = userEvent.setup();
    const { container } = render(<UserDropdown />);

    await user.click(container.querySelector('.dropdown-toggle') as HTMLButtonElement);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
