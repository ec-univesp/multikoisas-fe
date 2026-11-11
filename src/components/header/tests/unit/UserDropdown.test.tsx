import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import UserDropdown from '../../UserDropdown';

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

  it('offers site settings and sign-out, without links to the template demo pages', async () => {
    const user = userEvent.setup();
    const { container } = render(<UserDropdown />);

    await user.click(container.querySelector('.dropdown-toggle') as HTMLButtonElement);

    expect(screen.getByRole('link', { name: 'Configurações de site' })).toHaveAttribute('href', '/store');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('shows the site version from package.json below "Sair"', async () => {
    const { version } = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    const user = userEvent.setup();
    const { container } = render(<UserDropdown />);

    await user.click(container.querySelector('.dropdown-toggle') as HTMLButtonElement);

    const versionLabel = screen.getByText(`v${version}`);
    expect(versionLabel.textContent).toMatch(/^v\d+\.\d+\.\d+$/);
    expect(screen.getByRole('button', { name: 'Sair' }).compareDocumentPosition(versionLabel)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('shows only the word Administrador, without the template stock photo', () => {
    const { container } = render(<UserDropdown />);

    expect(container.querySelector('.dropdown-toggle')).toHaveTextContent('Administrador');
    expect(container.querySelector('img')).toBeNull();
  });
});
