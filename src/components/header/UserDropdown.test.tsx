import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import UserDropdown from './UserDropdown';

vi.mock('@/features/admin-auth/actions', () => ({ loginAction: vi.fn(), logoutAction: vi.fn() }));

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
});
