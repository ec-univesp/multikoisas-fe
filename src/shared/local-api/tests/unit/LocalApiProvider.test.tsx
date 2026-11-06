import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LocalApiProvider } from '../../LocalApiProvider';
import { startLocalApi } from '../../startLocalApi';

vi.mock('../../startLocalApi', () => ({ startLocalApi: vi.fn() }));

describe('LocalApiProvider', () => {
  it('shows a loading notice until the local api is running', async () => {
    let finishStart = () => {};
    vi.mocked(startLocalApi).mockReturnValue(new Promise<void>((resolve) => (finishStart = resolve)));
    render(<LocalApiProvider>Vitrine</LocalApiProvider>);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
    expect(screen.queryByText('Vitrine')).not.toBeInTheDocument();

    finishStart();
    expect(await screen.findByText('Vitrine')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('still shows the page when the local api cannot start', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(startLocalApi).mockRejectedValue(new Error('no service worker'));
    render(<LocalApiProvider>Vitrine</LocalApiProvider>);
    expect(await screen.findByText('Vitrine')).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });
});
