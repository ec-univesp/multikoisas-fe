import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { server } from '@/test/msw/server';
import { StoreLogoField } from '../../StoreLogoField';

const logo = () => new File(['png'], 'logo.png', { type: 'image/png' });

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:logo-1');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('StoreLogoField saving', () => {
  it('shows the saved logo as the current one', async () => {
    apiDatabase.storeSettings.logoUrl = '/local-images/5';
    render(<StoreLogoField />);
    await waitFor(() =>
      expect(screen.getByRole('img', { name: 'Logo atual' })).toHaveAttribute('src', '/local-images/5'),
    );
  });

  it('enables saving only once a valid image is chosen', async () => {
    const user = userEvent.setup();
    render(<StoreLogoField />);
    expect(screen.getByRole('button', { name: 'Salvar logo' })).toBeDisabled();

    await user.upload(screen.getByLabelText('Nova logo'), logo());

    expect(screen.getByRole('button', { name: 'Salvar logo' })).toBeEnabled();
    expect(screen.queryByText(/ainda não está disponível/)).not.toBeInTheDocument();
  });

  it('saves the chosen logo and shows it as the current one', async () => {
    const user = userEvent.setup();
    render(<StoreLogoField />);

    await user.upload(screen.getByLabelText('Nova logo'), logo());
    await user.click(screen.getByRole('button', { name: 'Salvar logo' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Logo salva.');
    expect(screen.getByRole('img', { name: 'Logo atual' })).toHaveAttribute('src', '/local-images/100');
    expect(screen.queryByAltText('Prévia da logo nova')).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:logo-1');
    expect(apiDatabase.storeSettings.logoUrl).toBe('/local-images/100');
    expect(screen.getByRole('button', { name: 'Salvar logo' })).toBeDisabled();
  });

  it('keeps the preview and tells when the logo could not be saved', async () => {
    server.use(http.post('*/configuracao/logo', () => new HttpResponse(null, { status: 507 })));
    const user = userEvent.setup();
    render(<StoreLogoField />);

    await user.upload(screen.getByLabelText('Nova logo'), logo());
    await user.click(screen.getByRole('button', { name: 'Salvar logo' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar a logo.');
    expect(screen.getByAltText('Prévia da logo nova')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar logo' })).toBeEnabled();
  });

  it('goes back to the default logo', async () => {
    apiDatabase.storeSettings.logoUrl = '/local-images/5';
    const user = userEvent.setup();
    render(<StoreLogoField />);

    await user.click(await screen.findByRole('button', { name: 'Voltar para a logo padrão' }));

    expect(await screen.findByRole('status')).toHaveTextContent('A vitrine voltou para a logo padrão.');
    expect(screen.getByRole('img', { name: 'Logo atual' })).toHaveTextContent('MultiKoisas');
    expect(screen.queryByRole('button', { name: 'Voltar para a logo padrão' })).not.toBeInTheDocument();
    expect(apiDatabase.storeSettings.logoUrl).toBeNull();
  });

  it('tells when it could not go back to the default logo', async () => {
    apiDatabase.storeSettings.logoUrl = '/local-images/5';
    server.use(http.delete('*/configuracao/logo', () => new HttpResponse(null, { status: 507 })));
    const user = userEvent.setup();
    render(<StoreLogoField />);

    await user.click(await screen.findByRole('button', { name: 'Voltar para a logo padrão' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível voltar para a logo padrão.');
    expect(screen.getByRole('img', { name: 'Logo atual' })).toHaveAttribute('src', '/local-images/5');
  });

  it('offers the default logo only when a logo is saved', async () => {
    render(<StoreLogoField />);
    await screen.findByRole('button', { name: 'Salvar logo' });
    expect(screen.queryByRole('button', { name: 'Voltar para a logo padrão' })).not.toBeInTheDocument();
  });
});
