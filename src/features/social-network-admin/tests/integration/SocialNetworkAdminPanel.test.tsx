import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import type { SocialNetwork } from '@/entities/social-network';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { recordApiRequests, server } from '@/test/msw/server';
import { SocialNetworkAdminPanel } from '../../SocialNetworkAdminPanel';

const socialNetworks: SocialNetwork[] = [
  { id: 1, name: 'Instagram', url: 'https://www.instagram.com/multikoisas' },
  { id: 2, name: 'Shopee', url: 'https://shopee.com.br/multikoisas' },
];

let apiRequests: string[] = [];

beforeEach(() => {
  apiRequests = recordApiRequests();
});

const respondWith = (method: 'get' | 'post' | 'put' | 'delete', path: string, status: number) =>
  server.use(http[method](path, () => new HttpResponse(null, { status })));

const renderPanel = (initialSocialNetworks: SocialNetwork[] = socialNetworks) =>
  render(<SocialNetworkAdminPanel initialSocialNetworks={initialSocialNetworks} />);

type User = ReturnType<typeof userEvent.setup>;

const fillForm = async (user: User, name: string, url: string) => {
  const nameField = screen.getByLabelText('Nome da rede');
  const urlField = screen.getByLabelText('Link');
  await user.clear(nameField);
  if (name) await user.type(nameField, name);
  await user.clear(urlField);
  if (url) await user.type(urlField, url);
  await user.click(screen.getByRole('button', { name: 'Salvar rede' }));
};

const submitNewSocialNetwork = async (user: User, name: string, url: string) => {
  await user.click(screen.getByRole('button', { name: 'Nova rede' }));
  await fillForm(user, name, url);
};

describe('SocialNetworkAdminPanel', () => {
  it('lists the social networks with their links and count', () => {
    renderPanel();

    expect(screen.getByText('2 redes cadastradas')).toBeInTheDocument();
    expect(screen.getByText('https://shopee.com.br/multikoisas')).toBeInTheDocument();
    expect(screen.queryByText('Link sem https, não aparece na vitrine')).not.toBeInTheDocument();
  });

  it('uses the singular count and flags a link the storefront hides', () => {
    renderPanel([{ id: 3, name: 'WhatsApp', url: 'wa.me/5511999999999' }]);

    expect(screen.getByText('1 rede cadastrada')).toBeInTheDocument();
    expect(screen.getByText('Link sem https, não aparece na vitrine')).toBeInTheDocument();
  });

  it('creates the social network and reloads the list to get its id', async () => {
    const user = userEvent.setup();
    renderPanel();

    await submitNewSocialNetwork(user, '  Facebook  ', 'https://facebook.com/multikoisas');

    expect(await screen.findByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('3 redes cadastradas')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nome da rede')).not.toBeInTheDocument();
    expect(apiDatabase.redesSociais).toContainEqual({
      id: 100,
      descricao: 'Facebook',
      link: 'https://facebook.com/multikoisas',
    });
    expect(apiRequests).toEqual(['POST /api/socialnetwork', 'GET /api/socialnetwork']);
  });

  it('requires a name before calling the api', async () => {
    const user = userEvent.setup();
    renderPanel();

    await submitNewSocialNetwork(user, '', 'https://facebook.com/multikoisas');

    expect(screen.getByText('Informe o nome da rede.')).toHaveAttribute('role', 'alert');
    expect(apiRequests).toEqual([]);
  });

  it('rejects a repeated name that differs only in case, accents or spacing', async () => {
    const user = userEvent.setup();
    renderPanel([{ id: 1, name: 'Loja Física', url: 'https://loja.com' }]);

    await submitNewSocialNetwork(user, ' loja   fisica ', 'https://outra.com');

    expect(screen.getByText('Já existe uma rede com esse nome.')).toBeInTheDocument();
    expect(apiRequests).toEqual([]);
  });

  it.each(['wa.me/5511999999999', 'http://facebook.com/multikoisas', ''])(
    'rejects the link "%s" because it is not a valid https address',
    async (url) => {
      const user = userEvent.setup();
      renderPanel();

      await submitNewSocialNetwork(user, 'Facebook', url);

      expect(screen.getByText('Informe um link completo, começando com https://.')).toBeInTheDocument();
      expect(apiRequests).toEqual([]);
    },
  );

  it('warns about a repeated name when the api answers 409', async () => {
    respondWith('post', '*/socialnetwork', 409);
    const user = userEvent.setup();
    renderPanel();

    await submitNewSocialNetwork(user, 'Facebook', 'https://facebook.com/multikoisas');

    expect(await screen.findByText('Já existe uma rede com esse nome.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome da rede')).toBeInTheDocument();
  });

  it('keeps the form open with a generic message when the api fails to save', async () => {
    respondWith('post', '*/socialnetwork', 401);
    const user = userEvent.setup();
    renderPanel();

    await submitNewSocialNetwork(user, 'Facebook', 'https://facebook.com/multikoisas');

    expect(await screen.findByText('Não foi possível salvar a rede. Tente de novo.')).toBeInTheDocument();
    expect(screen.getByText('2 redes cadastradas')).toBeInTheDocument();
  });

  it('asks for a page reload when the network was saved but the list failed to reload', async () => {
    respondWith('get', '*/socialnetwork', 500);
    const user = userEvent.setup();
    renderPanel();

    await submitNewSocialNetwork(user, 'Facebook', 'https://facebook.com/multikoisas');

    expect(
      await screen.findByText('A rede foi salva, mas a lista não atualizou. Recarregue a página.'),
    ).toHaveAttribute('role', 'alert');
    expect(screen.queryByLabelText('Nome da rede')).not.toBeInTheDocument();
  });

  it('blocks cancel and a second submit while the social network is being saved', async () => {
    server.use(http.post('*/socialnetwork', () => delay('infinite')));
    const user = userEvent.setup();
    renderPanel();

    await submitNewSocialNetwork(user, 'Facebook', 'https://facebook.com/multikoisas');

    expect(await screen.findByRole('button', { name: 'Salvando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(screen.getByLabelText('Nome da rede')).toBeInTheDocument();
  });

  it('fixes the link of a social network, keeping its own name allowed', async () => {
    apiDatabase.redesSociais.push({ id: 3, descricao: 'Minha Loja', link: 'loja.com' });
    const user = userEvent.setup();
    renderPanel([...socialNetworks, { id: 3, name: 'Minha Loja', url: 'loja.com' }]);

    await user.click(screen.getByRole('button', { name: 'Editar Minha Loja' }));
    expect(screen.getByLabelText('Nome da rede')).toHaveValue('Minha Loja');
    expect(screen.getByLabelText('Link')).toHaveValue('loja.com');
    await fillForm(user, 'Minha Loja', 'https://loja.com');

    expect(await screen.findByText('https://loja.com')).toBeInTheDocument();
    expect(screen.queryByText('Link sem https, não aparece na vitrine')).not.toBeInTheDocument();
    expect(apiDatabase.redesSociais).toContainEqual({ id: 3, descricao: 'Minha Loja', link: 'https://loja.com' });
    expect(apiRequests).toEqual(['PUT /api/socialnetwork/Minha%20Loja']);
  });

  it('renames a social network', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Editar Shopee' }));
    await fillForm(user, 'Shopee Oficial', 'https://shopee.com.br/multikoisas');

    expect(await screen.findByText('Shopee Oficial')).toBeInTheDocument();
    expect(screen.getByText('2 redes cadastradas')).toBeInTheDocument();
  });

  it('keeps the social network when the deletion is cancelled', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Shopee' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByText('Shopee')).toBeInTheDocument();
    expect(apiRequests).toEqual([]);
  });

  it('deletes the social network in the api after confirmation', async () => {
    const user = userEvent.setup();
    renderPanel([{ id: 2, name: 'Shopee', url: 'https://shopee.com.br/multikoisas' }]);

    await user.click(screen.getByRole('button', { name: 'Apagar Shopee' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByText('Nenhuma rede cadastrada.')).toBeInTheDocument();
    expect(apiDatabase.redesSociais.map((redeSocial) => redeSocial.descricao)).toEqual(['Instagram']);
    expect(apiRequests).toEqual(['DELETE /api/socialnetwork/Shopee']);
  });

  it('drops a social network that was already deleted elsewhere (api answers 404)', async () => {
    const user = userEvent.setup();
    renderPanel([...socialNetworks, { id: 9, name: 'TikTok', url: 'https://tiktok.com/@multikoisas' }]);

    await user.click(screen.getByRole('button', { name: 'Apagar TikTok' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByText('2 redes cadastradas')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the social network with a generic message on other delete failures', async () => {
    respondWith('delete', '*/socialnetwork/:description', 401);
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Shopee' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(
      await screen.findByText('Não foi possível apagar a rede. Recarregue a página e tente de novo.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Shopee')).toBeInTheDocument();
  });

  it('blocks cancel, Escape and a second confirmation while the social network is being deleted', async () => {
    server.use(http.delete('*/socialnetwork/:description', () => delay('infinite')));
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
