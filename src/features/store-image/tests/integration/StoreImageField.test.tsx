import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiDatabase, SUPABASE_IMAGES } from '@/test/msw/apiDatabase';
import { server } from '@/test/msw/server';
import { StoreImageField } from '../../StoreImageField';

const SAVED_LOGO = `${SUPABASE_IMAGES}/logo.png`;
const UPLOADED_IMAGE = `${SUPABASE_IMAGES}/upload-100`;

const PLACEHOLDER_LOGO = { id: 1, imagemUrl: 'URL 1', tipo: 'LOGO' };

const saveLogo = () => apiDatabase.storeImages.push({ id: 5, imagemUrl: SAVED_LOGO, tipo: 'LOGO' });

const logo = () => new File(['png'], 'logo.png', { type: 'image/png' });

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:logo-1');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('StoreImageField saving', () => {
  it('shows the saved logo as the current one', async () => {
    saveLogo();
    render(<StoreImageField type="LOGO" />);
    await waitFor(() => expect(screen.getByRole('img', { name: 'Logo atual' })).toHaveAttribute('src', SAVED_LOGO));
  });

  it('enables saving only once a valid image is chosen', async () => {
    const user = userEvent.setup();
    render(<StoreImageField type="LOGO" />);
    expect(screen.getByRole('button', { name: 'Salvar logo' })).toBeDisabled();

    await user.upload(screen.getByLabelText('Nova logo'), logo());

    expect(screen.getByRole('button', { name: 'Salvar logo' })).toBeEnabled();
    expect(screen.queryByText(/ainda não está disponível/)).not.toBeInTheDocument();
  });

  it('saves the chosen logo and shows it as the current one', async () => {
    const user = userEvent.setup();
    render(<StoreImageField type="LOGO" />);

    await user.upload(screen.getByLabelText('Nova logo'), logo());
    await user.click(screen.getByRole('button', { name: 'Salvar logo' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Logo salva.');
    expect(screen.getByRole('status')).toHaveFocus();
    expect(screen.getByRole('img', { name: 'Logo atual' })).toHaveAttribute('src', UPLOADED_IMAGE);
    expect(screen.queryByAltText('Prévia da logo nova')).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:logo-1');
    expect(apiDatabase.storeImages).toEqual([PLACEHOLDER_LOGO, { id: 100, imagemUrl: UPLOADED_IMAGE, tipo: 'LOGO' }]);
    expect(screen.getByRole('button', { name: 'Salvar logo' })).toBeDisabled();
  });

  it('locks the file choice and the discard while the logo is being saved', async () => {
    let finishUpload = () => {};
    server.use(
      http.post('*/imagemloja', () => new Promise<undefined>((resolve) => (finishUpload = () => resolve(undefined))), {
        once: true,
      }),
    );
    const user = userEvent.setup();
    render(<StoreImageField type="LOGO" />);

    await user.upload(screen.getByLabelText('Nova logo'), logo());
    await user.click(screen.getByRole('button', { name: 'Salvar logo' }));

    expect(screen.getByLabelText('Nova logo')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Descartar' })).toBeDisabled();

    finishUpload();
    expect(await screen.findByRole('status')).toHaveTextContent('Logo salva.');
    expect(screen.getByLabelText('Nova logo')).toBeEnabled();
  });

  it('keeps the preview and tells when the logo could not be saved', async () => {
    server.use(http.post('*/imagemloja', () => new HttpResponse(null, { status: 507 })));
    const user = userEvent.setup();
    render(<StoreImageField type="LOGO" />);

    await user.upload(screen.getByLabelText('Nova logo'), logo());
    await user.click(screen.getByRole('button', { name: 'Salvar logo' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar a logo.');
    expect(screen.getByAltText('Prévia da logo nova')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar logo' })).toBeEnabled();
  });

  it('goes back to the default logo', async () => {
    saveLogo();
    const user = userEvent.setup();
    render(<StoreImageField type="LOGO" />);

    await user.click(await screen.findByRole('button', { name: 'Voltar para a logo padrão' }));

    expect(await screen.findByRole('status')).toHaveTextContent('A vitrine voltou para a logo padrão.');
    expect(screen.getByRole('status')).toHaveFocus();
    expect(screen.getByRole('img', { name: 'Logo atual' })).toHaveTextContent('MultiKoisas');
    expect(screen.queryByRole('button', { name: 'Voltar para a logo padrão' })).not.toBeInTheDocument();
    expect(apiDatabase.storeImages).toEqual([PLACEHOLDER_LOGO]);
  });

  it('tells when it could not go back to the default logo', async () => {
    saveLogo();
    server.use(http.delete('*/imagemloja/:type', () => new HttpResponse(null, { status: 507 })));
    const user = userEvent.setup();
    render(<StoreImageField type="LOGO" />);

    await user.click(await screen.findByRole('button', { name: 'Voltar para a logo padrão' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível voltar para a logo padrão.');
    expect(screen.getByRole('img', { name: 'Logo atual' })).toHaveAttribute('src', SAVED_LOGO);
  });

  it('offers the default logo only when a logo is saved', async () => {
    render(<StoreImageField type="LOGO" />);
    await screen.findByRole('button', { name: 'Salvar logo' });
    expect(screen.queryByRole('button', { name: 'Voltar para a logo padrão' })).not.toBeInTheDocument();
  });

  it('keeps the success message when the new image is saved but an older one cannot be deleted', async () => {
    saveLogo();
    server.use(http.delete('*/imagemloja/:type', () => new HttpResponse(null, { status: 500 })));
    const user = userEvent.setup();
    render(<StoreImageField type="LOGO" />);

    await user.upload(screen.getByLabelText('Nova logo'), logo());
    await user.click(screen.getByRole('button', { name: 'Salvar logo' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Logo salva.');
    expect(screen.getByRole('img', { name: 'Logo atual' })).toHaveAttribute('src', UPLOADED_IMAGE);
  });

  it('saves and removes the store photo as the cover image', async () => {
    const user = userEvent.setup();
    render(<StoreImageField type="CAPA" />);

    await user.upload(screen.getByLabelText('Nova foto'), logo());
    await user.click(screen.getByRole('button', { name: 'Salvar foto' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Foto salva.');
    expect(screen.getByRole('img', { name: 'Foto atual' })).toHaveAttribute('src', UPLOADED_IMAGE);
    expect(apiDatabase.storeImages).toContainEqual({ id: 100, imagemUrl: UPLOADED_IMAGE, tipo: 'CAPA' });

    await user.click(screen.getByRole('button', { name: 'Remover foto' }));

    expect(await screen.findByText('Foto removida.')).toHaveFocus();
    expect(screen.getByText('Nenhuma foto cadastrada')).toBeInTheDocument();
  });

  it('tells when the store photo could not be saved nor removed', async () => {
    apiDatabase.storeImages.push({ id: 6, imagemUrl: `${SUPABASE_IMAGES}/fachada.jpg`, tipo: 'CAPA' });
    server.use(
      http.post('*/imagemloja', () => new HttpResponse(null, { status: 500 })),
      http.delete('*/imagemloja/:type', () => new HttpResponse(null, { status: 500 })),
    );
    const user = userEvent.setup();
    render(<StoreImageField type="CAPA" />);

    await user.click(await screen.findByRole('button', { name: 'Remover foto' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível remover a foto.');

    await user.upload(screen.getByLabelText('Nova foto'), logo());
    await user.click(screen.getByRole('button', { name: 'Salvar foto' }));
    expect(await screen.findByText('Não foi possível salvar a foto.')).toBeInTheDocument();
  });
});
