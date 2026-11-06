import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { SalesChannelAdminPanel } from '../../SalesChannelAdminPanel';
import type { SalesChannel } from '@/entities/sales-channel';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { recordApiRequests, server } from '@/test/msw/server';

const salesChannels: SalesChannel[] = [
  { id: 2, name: 'Shopee' },
  { id: 3, name: 'Instagram' },
  { id: 4, name: 'Facebook' },
  { id: 5, name: 'TikTok' },
];

let apiRequests: string[] = [];

beforeEach(() => {
  apiRequests = recordApiRequests();
});

const respondWith = (method: 'post' | 'delete', path: string, status: number) =>
  server.use(http[method](path, () => new HttpResponse(null, { status })));

const hang = (method: 'post' | 'delete', path: string) => server.use(http[method](path, () => delay('infinite')));

const deleteFromApi = (canalVendaId: number) => {
  apiDatabase.salesChannels = apiDatabase.salesChannels.filter((salesChannel) => salesChannel.id !== canalVendaId);
};

const renderPanel = (initialSalesChannels: SalesChannel[] = salesChannels) =>
  render(<SalesChannelAdminPanel initialSalesChannels={initialSalesChannels} />);

const submitNewSalesChannel = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole('button', { name: 'Novo canal' }));
  if (name) await user.type(screen.getByLabelText('Nome do canal'), name);
  await user.click(screen.getByRole('button', { name: 'Salvar canal' }));
};

describe('SalesChannelAdminPanel', () => {
  it('lists the sales channels with their count and no edit action', () => {
    renderPanel();
    expect(screen.getByText('4 canais cadastrados')).toBeInTheDocument();
    expect(screen.getByText('Shopee')).toBeInTheDocument();
    expect(screen.getByText('TikTok')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument();
  });

  it('uses the singular count for a single sales channel', () => {
    renderPanel([{ id: 2, name: 'Shopee' }]);
    expect(screen.getByText('1 canal cadastrado')).toBeInTheDocument();
  });

  it('shows the empty state without sales channels', () => {
    renderPanel([]);
    expect(screen.getByText('Nenhum canal cadastrado.')).toBeInTheDocument();
  });

  it('creates the sales channel with the trimmed name, lets the api pick the id and lists it', async () => {
    const user = userEvent.setup();
    renderPanel();

    await submitNewSalesChannel(user, '  Mercado   Livre  ');

    expect(await screen.findByText('Mercado Livre')).toBeInTheDocument();
    expect(screen.getByText('5 canais cadastrados')).toBeInTheDocument();
    expect(apiDatabase.salesChannels).toContainEqual({ id: 100, nome: 'Mercado Livre' });
    expect(apiRequests).toEqual(['POST /api/canalvenda']);
  });

  it('requires a name before calling the api', async () => {
    const user = userEvent.setup();
    renderPanel();

    await submitNewSalesChannel(user, '');

    expect(screen.getByText('Informe o nome do canal.')).toBeInTheDocument();
    expect(apiRequests).toEqual([]);
  });

  it('rejects a name already used by another sales channel, ignoring case', async () => {
    const user = userEvent.setup();
    renderPanel();

    await submitNewSalesChannel(user, ' shopee ');

    expect(screen.getByText('Já existe um canal com esse nome.')).toHaveAttribute('role', 'alert');
    expect(apiRequests).toEqual([]);
  });

  it('rejects a repeated name that differs only in accents or spacing', async () => {
    const user = userEvent.setup();
    renderPanel([{ id: 2, name: 'Loja Física' }]);

    await submitNewSalesChannel(user, 'loja   fisica');

    expect(screen.getByText('Já existe um canal com esse nome.')).toBeInTheDocument();
    expect(apiRequests).toEqual([]);
  });

  it('closes the form when the channel turns out to be already created', async () => {
    apiDatabase.salesChannels.push({ id: 6, nome: 'Mercado Livre' });
    const user = userEvent.setup();
    renderPanel();

    await submitNewSalesChannel(user, 'Mercado Livre');

    expect(
      await screen.findByText('O canal "Mercado Livre" já tinha sido criado. A lista foi atualizada.'),
    ).toHaveAttribute('role', 'alert');
    expect(screen.getByText('Mercado Livre')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nome do canal')).not.toBeInTheDocument();
  });

  it('keeps the form open with a message when the api fails to save', async () => {
    respondWith('post', '*/canalvenda', 500);
    const user = userEvent.setup();
    renderPanel();

    await submitNewSalesChannel(user, 'Mercado Livre');

    expect(await screen.findByText('Não foi possível salvar o canal. Tente de novo.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome do canal')).toBeInTheDocument();
    expect(screen.getByText('4 canais cadastrados')).toBeInTheDocument();
  });

  it('blocks cancel and a second submit while the sales channel is being saved', async () => {
    hang('post', '*/canalvenda');
    const user = userEvent.setup();
    renderPanel();

    await submitNewSalesChannel(user, 'Mercado Livre');

    expect(await screen.findByRole('button', { name: 'Salvando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(screen.getByLabelText('Nome do canal')).toBeInTheDocument();
  });

  it('keeps the sales channel when the deletion is cancelled', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Shopee' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByText('Shopee')).toBeInTheDocument();
    expect(apiRequests).toEqual([]);
  });

  it('deletes the sales channel in the api after confirmation', async () => {
    const user = userEvent.setup();
    renderPanel([{ id: 4, name: 'Facebook' }]);

    await user.click(screen.getByRole('button', { name: 'Apagar Facebook' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByText('Nenhum canal cadastrado.')).toBeInTheDocument();
    expect(apiDatabase.salesChannels.map((salesChannel) => salesChannel.id)).toEqual([2, 3, 5, 8]);
    expect(apiRequests).toEqual(['DELETE /api/canalvenda/4']);
  });

  it('drops a sales channel that was already deleted elsewhere', async () => {
    deleteFromApi(2);
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Shopee' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByText('3 canais cadastrados')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('explains that a channel with linked products cannot be deleted (api answers 409)', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Shopee' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByText('Este canal tem produtos vinculados e não pode ser apagado.')).toHaveAttribute(
      'role',
      'alert',
    );
    expect(screen.getByText('Shopee')).toBeInTheDocument();
  });

  it('keeps the sales channel with a generic message on other delete failures', async () => {
    respondWith('delete', '*/canalvenda/:id', 403);
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Shopee' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(
      await screen.findByText('Não foi possível apagar o canal. Recarregue a página e tente de novo.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Shopee')).toBeInTheDocument();
  });

  it('blocks cancel, Escape and a second confirmation while the sales channel is being deleted', async () => {
    hang('delete', '*/canalvenda/:id');
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Shopee' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByRole('button', { name: 'Apagando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Apagando...' })).toBeInTheDocument();
  });
});
