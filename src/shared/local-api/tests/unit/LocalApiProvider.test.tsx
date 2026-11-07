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

  it('explains which browsers can run the site when the local api cannot start', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(startLocalApi).mockRejectedValue(new Error('no service worker'));
    render(<LocalApiProvider>Vitrine</LocalApiProvider>);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este navegador não permite rodar o site. Use o Chrome, o Edge ou o Safari fora da janela anônima.',
    );
    expect(screen.queryByText('Vitrine')).not.toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  it('shows the given fallback while the local api starts and when it cannot start', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let failStart = () => {};
    vi.mocked(startLocalApi).mockReturnValue(new Promise<void>((_resolve, reject) => (failStart = reject)));
    render(<LocalApiProvider fallback="Marca">Vitrine</LocalApiProvider>);
    expect(screen.getByText('Marca')).toBeInTheDocument();

    failStart();

    await vi.waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(screen.getByText('Marca')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
