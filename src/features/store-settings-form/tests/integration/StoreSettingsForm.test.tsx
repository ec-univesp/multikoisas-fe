import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { server } from '@/test/msw/server';
import { StoreSettingsForm } from '../../StoreSettingsForm';

const replaceText = async (label: string, value: string) => {
  const user = userEvent.setup();
  const field = screen.getByLabelText(label);
  await user.clear(field);
  if (value) await user.type(field, value);
  await user.tab();
};

describe('StoreSettingsForm saving', () => {
  it('waits for the saved settings and starts with them', async () => {
    apiDatabase.storeSettings.address = 'Rua Salva, 1';
    render(<StoreSettingsForm />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
    expect(await screen.findByLabelText('Endereço')).toHaveValue('Rua Salva, 1');
    expect(screen.getByLabelText('Nota no Google')).toHaveValue(4.7);
  });

  it('offers to try again, without the fields, when the saved settings cannot be read', async () => {
    server.use(http.get('*/configuracao', () => new HttpResponse(null, { status: 500 }), { once: true }));
    const user = userEvent.setup();
    render(<StoreSettingsForm />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os dados da loja.');
    expect(screen.queryByLabelText('Endereço')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByLabelText('Quantidade de avaliações')).toHaveValue(387);
  });

  it('saves the changed settings', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsForm />);
    await screen.findByLabelText('Endereço');

    await replaceText('Endereço', 'Rua Nova, 10');
    await replaceText('Link das avaliações no Google', '');
    await replaceText('Nota no Google', '4.9');
    await replaceText('Quantidade de avaliações', '400');
    await user.click(screen.getByRole('button', { name: 'Salvar dados' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Dados salvos.');
    expect(apiDatabase.storeSettings).toEqual({
      address: 'Rua Nova, 10',
      googleReviewsUrl: null,
      googleRating: 4.9,
      googleReviewCount: 400,
      logoUrl: null,
    });
  });

  it('keeps saving disabled while a field is invalid', async () => {
    render(<StoreSettingsForm />);
    await screen.findByLabelText('Endereço');
    const save = screen.getByRole('button', { name: 'Salvar dados' });
    expect(save).toBeEnabled();

    await replaceText('Nota no Google', '6');
    expect(save).toBeDisabled();

    await replaceText('Nota no Google', '5');
    expect(save).toBeEnabled();
  });

  it('keeps saving disabled while saving', async () => {
    let answerSave = () => {};
    server.use(
      http.put(
        '*/configuracao',
        () => new Promise<Response>((resolve) => (answerSave = () => resolve(HttpResponse.json({})))),
      ),
    );
    const user = userEvent.setup();
    render(<StoreSettingsForm />);
    await screen.findByLabelText('Endereço');

    await user.click(screen.getByRole('button', { name: 'Salvar dados' }));

    expect(screen.getByRole('button', { name: 'Salvar dados' })).toBeDisabled();
    answerSave();
    expect(await screen.findByText('Dados salvos.')).toBeInTheDocument();
  });

  it('tells when the settings could not be saved', async () => {
    server.use(http.put('*/configuracao', () => HttpResponse.text('Espaço do navegador cheio', { status: 507 })));
    const user = userEvent.setup();
    render(<StoreSettingsForm />);
    await screen.findByLabelText('Endereço');

    await user.click(screen.getByRole('button', { name: 'Salvar dados' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar os dados.');
    expect(screen.getByRole('button', { name: 'Salvar dados' })).toBeEnabled();
  });

  it('drops the saved message once a field changes', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsForm />);
    await screen.findByLabelText('Endereço');
    await user.click(screen.getByRole('button', { name: 'Salvar dados' }));
    await screen.findByText('Dados salvos.');

    await user.type(screen.getByLabelText('Endereço'), ' fundos');

    expect(screen.queryByText('Dados salvos.')).not.toBeInTheDocument();
  });

  it('no longer says saving is unavailable', async () => {
    render(<StoreSettingsForm />);
    await screen.findByLabelText('Endereço');
    expect(screen.queryByText(/ainda não está disponível/)).not.toBeInTheDocument();
  });
});
