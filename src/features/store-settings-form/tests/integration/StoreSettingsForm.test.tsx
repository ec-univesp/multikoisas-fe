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
    render(<StoreSettingsForm />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
    expect(await screen.findByLabelText('Descrição da loja')).toHaveValue('Tudo em um só lugar');
  });

  it('offers to try again, without the fields, when the saved settings cannot be read', async () => {
    server.use(http.get('*/loja', () => new HttpResponse(null, { status: 500 }), { once: true }));
    const user = userEvent.setup();
    render(<StoreSettingsForm />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os dados da loja.');
    expect(screen.queryByLabelText('Descrição da loja')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByLabelText('Descrição da loja')).toBeInTheDocument();
  });

  it('saves the changed settings to the store row id', async () => {
    const paths: string[] = [];
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'PUT') paths.push(new URL(request.url).pathname);
    });
    const user = userEvent.setup();
    render(<StoreSettingsForm />);
    await screen.findByLabelText('Descrição da loja');

    await replaceText('Descrição da loja', '  Utilidades para a casa  ');
    await replaceText('Endereço da loja', '  Rua das Flores, 10  ');
    await user.click(screen.getByRole('button', { name: 'Salvar dados' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Dados salvos.');
    expect(apiDatabase.stores).toEqual([
      {
        id: 1,
        nomeLoja: 'multikoisas',
        descricaoLoja: 'Utilidades para a casa',
        endereco: 'Rua das Flores, 10',
        corDestaque: null,
        colunaCarrossel: 0,
      },
    ]);
    expect(paths).toEqual(['/api/loja/1']);
  });

  it('keeps the showcase accent color and columns when saving the store data', async () => {
    Object.assign(apiDatabase.stores[0], { corDestaque: '#22c55e', colunaCarrossel: 3 });
    const user = userEvent.setup();
    render(<StoreSettingsForm />);
    await screen.findByLabelText('Descrição da loja');
    await replaceText('Descrição da loja', 'Nova');
    await user.click(screen.getByRole('button', { name: 'Salvar dados' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Dados salvos.');
    expect(apiDatabase.stores[0]).toEqual(
      expect.objectContaining({ descricaoLoja: 'Nova', corDestaque: '#22c55e', colunaCarrossel: 3 }),
    );
  });

  it('starts with the saved address', async () => {
    render(<StoreSettingsForm />);
    expect(await screen.findByLabelText('Endereço da loja')).toHaveValue(
      'Av. Prof. Luiz Inácio de Anhaia Melo, 2085 - Centreville, Santo André - SP',
    );
  });

  it('saves an emptied address without blocking the description', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsForm />);
    await screen.findByLabelText('Endereço da loja');

    await replaceText('Endereço da loja', '   ');
    await user.click(screen.getByRole('button', { name: 'Salvar dados' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Dados salvos.');
    expect(apiDatabase.stores[0]).toEqual(
      expect.objectContaining({ descricaoLoja: 'Tudo em um só lugar', endereco: '' }),
    );
  });

  it('starts the address empty when the store has none saved', async () => {
    apiDatabase.stores[0].endereco = null;
    render(<StoreSettingsForm />);
    expect(await screen.findByLabelText('Endereço da loja')).toHaveValue('');
  });

  it('keeps saving disabled while saving', async () => {
    let answerSave = () => {};
    server.use(
      http.put(
        '*/loja/:id',
        () => new Promise<Response>((resolve) => (answerSave = () => resolve(HttpResponse.json({})))),
      ),
    );
    const user = userEvent.setup();
    render(<StoreSettingsForm />);
    await screen.findByLabelText('Descrição da loja');

    await user.click(screen.getByRole('button', { name: 'Salvar dados' }));

    expect(screen.getByRole('button', { name: 'Salvar dados' })).toBeDisabled();
    answerSave();
    expect(await screen.findByText('Dados salvos.')).toBeInTheDocument();
  });

  it('tells when the settings could not be saved', async () => {
    server.use(http.put('*/loja/:id', () => new HttpResponse(null, { status: 500 })));
    const user = userEvent.setup();
    render(<StoreSettingsForm />);
    await screen.findByLabelText('Descrição da loja');

    await user.click(screen.getByRole('button', { name: 'Salvar dados' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar os dados.');
    expect(screen.getByRole('button', { name: 'Salvar dados' })).toBeEnabled();
  });

  it('drops the saved message once a field changes', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsForm />);
    await screen.findByLabelText('Descrição da loja');
    await user.click(screen.getByRole('button', { name: 'Salvar dados' }));
    await screen.findByText('Dados salvos.');

    await user.type(screen.getByLabelText('Descrição da loja'), ' e organização');

    expect(screen.queryByText('Dados salvos.')).not.toBeInTheDocument();
  });

  it('drops the saved message once the address changes', async () => {
    const user = userEvent.setup();
    render(<StoreSettingsForm />);
    await screen.findByLabelText('Endereço da loja');
    await user.click(screen.getByRole('button', { name: 'Salvar dados' }));
    await screen.findByText('Dados salvos.');

    await user.type(screen.getByLabelText('Endereço da loja'), ' fundos');

    expect(screen.queryByText('Dados salvos.')).not.toBeInTheDocument();
  });

  it('no longer says saving is unavailable', async () => {
    render(<StoreSettingsForm />);
    await screen.findByLabelText('Descrição da loja');
    expect(screen.queryByText(/ainda não está disponível/)).not.toBeInTheDocument();
  });
});
