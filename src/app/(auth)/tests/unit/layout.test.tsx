import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { startLocalApi } from '@/shared/local-api/startLocalApi';
import AuthLayout from '../../layout';

vi.mock('@/shared/local-api/startLocalApi', () => ({ startLocalApi: vi.fn() }));

describe('AuthLayout', () => {
  it('shows the login form and the text brand while the local api starts', () => {
    vi.mocked(startLocalApi).mockReturnValue(new Promise<void>(() => {}));
    render(AuthLayout({ children: <p>login</p> }));
    expect(screen.getByText('login')).toBeInTheDocument();
    expect(screen.getByText('koisas')).toBeInTheDocument();
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
  });

  it('keeps the login form and the text brand when the local api cannot start', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(startLocalApi).mockRejectedValue(new Error('no service worker'));
    render(AuthLayout({ children: <p>login</p> }));
    await vi.waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(screen.getByText('login')).toBeInTheDocument();
    expect(screen.getByText('koisas')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
