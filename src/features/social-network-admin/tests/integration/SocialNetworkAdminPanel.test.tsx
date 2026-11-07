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

// Happy path for when the back end fixes the POST, which today answers 409 to every create.
const acceptNewSocialNetworks = () =>
  server.use(
    http.post<never, { descricao: string; link: string }>('*/socialnetwork', async ({ request }) => {
      const { descricao, link } = await request.json();
      apiDatabase.socialNetworks.push({ id: apiDatabase.nextId++, descricao, link });
      return new HttpResponse(null, { status: 201 });
    }),
  );

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
    renderPanel([{ id: 3, name: 'Facebook', url: 'http://facebook.com/multikoisas' }]);

    expect(screen.getByText('1 rede cadastrada')).toBeInTheDocument();
    expect(screen.getByText('Link sem https, não aparece na vitrine')).toBeInTheDocument();
  });

  it('does not flag a link without the scheme, since the storefront completes it with https', () => {
    renderPanel([{ id: 3, name: 'WhatsApp', url: 'wa.me/message/V4IAOMTCK5XHP1' }]);

    expect(screen.getByText('wa.me/message/V4IAOMTCK5XHP1')).toBeInTheDocument();
    expect(screen.queryByText('Link sem https, não aparece na vitrine')).not.toBeInTheDocument();
  });

  it('creates the social network and reloads the list to get its id', async () => {
    acceptNewSocialNetworks();
    const user = userEvent.setup();
    renderPanel();

    await submitNewSocialNetwork(user, '  Facebook  ', 'https://facebook.com/multikoisas');

    expect(await screen.findByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('3 redes cadastradas')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nome da rede')).not.toBeInTheDocument();
    expect(apiDatabase.socialNetworks).toContainEqual({
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

  it.each([
    ['(11) 98765-4321', 'https://wa.me/5511987654321'],
    ['+55 11 98765-4321', 'https://wa.me/5511987654321'],
    ['11 3456 7890', 'https://wa.me/551134567890'],
  ])('builds the whatsapp link from the number "%s"', async (number, link) => {
    acceptNewSocialNetworks();
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Nova rede' }));
    await user.type(screen.getByLabelText('Nome da rede'), 'WhatsApp');
    const numberField = screen.getByLabelText('Número do WhatsApp');
    expect(numberField).toHaveAttribute('inputmode', 'tel');
    await user.type(numberField, number);
    await user.click(screen.getByRole('button', { name: 'Salvar rede' }));

    expect(await screen.findByText(link)).toBeInTheDocument();
    expect(apiDatabase.socialNetworks).toContainEqual({ id: 100, descricao: 'WhatsApp', link });
  });

  it.each(['(11) 9876-543', '', '5511987654321999', 'meu zap', 'https://example.com/zap'])(
    'rejects the whatsapp number "%s" without 10 or 11 digits',
    async (number) => {
      const user = userEvent.setup();
      renderPanel();

      await user.click(screen.getByRole('button', { name: 'Nova rede' }));
      await user.type(screen.getByLabelText('Nome da rede'), 'whatsapp');
      const numberField = screen.getByLabelText('Número do WhatsApp');
      if (number) await user.type(numberField, number);
      await user.click(screen.getByRole('button', { name: 'Salvar rede' }));

      expect(screen.getByText('Informe o número com DDD, como (11) 98765-4321.')).toHaveAttribute('role', 'alert');
      expect(apiRequests).toEqual([]);
    },
  );

  it('shows the number of a saved whatsapp link when editing it', async () => {
    const user = userEvent.setup();
    renderPanel([{ id: 3, name: 'WhatsApp', url: 'https://wa.me/5511987654321' }]);

    await user.click(screen.getByRole('button', { name: 'Editar WhatsApp' }));

    expect(screen.getByLabelText('Número do WhatsApp')).toHaveValue('11987654321');
  });

  it('keeps a saved whatsapp link that is not a number and lets it be swapped for one', async () => {
    apiDatabase.socialNetworks.push({ id: 3, descricao: 'WhatsApp', link: 'wa.me/message/V4IAOMTCK5XHP1' });
    const user = userEvent.setup();
    renderPanel([{ id: 3, name: 'WhatsApp', url: 'wa.me/message/V4IAOMTCK5XHP1' }]);

    await user.click(screen.getByRole('button', { name: 'Editar WhatsApp' }));
    const numberField = screen.getByLabelText('Número do WhatsApp');
    expect(numberField).toHaveValue('wa.me/message/V4IAOMTCK5XHP1');
    await user.click(screen.getByRole('button', { name: 'Salvar rede' }));
    expect(await screen.findByText('https://wa.me/message/V4IAOMTCK5XHP1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Editar WhatsApp' }));
    await user.clear(screen.getByLabelText('Número do WhatsApp'));
    await user.type(screen.getByLabelText('Número do WhatsApp'), '(11) 98765-4321');
    await user.click(screen.getByRole('button', { name: 'Salvar rede' }));

    expect(await screen.findByText('https://wa.me/5511987654321')).toBeInTheDocument();
    expect(apiDatabase.socialNetworks).toContainEqual({ id: 3, descricao: 'WhatsApp', link: 'https://wa.me/5511987654321' });
  });

  it('says the api refused the new network when it answers 409 and the name is not in the reloaded list', async () => {
    const user = userEvent.setup();
    renderPanel();

    await submitNewSocialNetwork(user, 'Facebook', 'https://facebook.com/multikoisas');

    expect(await screen.findByText('A API recusou o cadastro. O time do back já foi avisado.')).toHaveAttribute(
      'role',
      'alert',
    );
    expect(screen.queryByLabelText('Nome da rede')).not.toBeInTheDocument();
    expect(screen.getByText('2 redes cadastradas')).toBeInTheDocument();
    expect(apiRequests).toEqual(['POST /api/socialnetwork', 'GET /api/socialnetwork']);
  });

  it('treats a 409 as created when the name shows up in the reloaded list', async () => {
    server.use(
      http.post('*/socialnetwork', () => {
        apiDatabase.socialNetworks.push({ id: 50, descricao: 'Facebook', link: 'https://facebook.com/multikoisas' });
        return HttpResponse.text('Esta rede social já está cadastrada.', { status: 409 });
      }),
    );
    const user = userEvent.setup();
    renderPanel();

    await submitNewSocialNetwork(user, 'Facebook', 'https://facebook.com/multikoisas');

    expect(await screen.findByText('3 redes cadastradas')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the form open with a generic message when the list fails to reload after a 409', async () => {
    respondWith('get', '*/socialnetwork', 500);
    const user = userEvent.setup();
    renderPanel();

    await submitNewSocialNetwork(user, 'Facebook', 'https://facebook.com/multikoisas');

    expect(await screen.findByText('Não foi possível salvar a rede. Tente de novo.')).toBeInTheDocument();
  });

  it.each(['Loja/Online', 'Loja\\Online', '100%', 'Loja;Online', '.', '..'])(
    'rejects the name "%s" because the api cannot find it in the address',
    async (name) => {
      const user = userEvent.setup();
      renderPanel();

      await submitNewSocialNetwork(user, name, 'https://facebook.com/multikoisas');

      expect(screen.getByText('Use um nome sem / \\ % ; e diferente de "." ou "..".')).toHaveAttribute('role', 'alert');
      expect(apiRequests).toEqual([]);
    },
  );

  it('warns the storefront takes a few minutes to show the change', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Nova rede' }));

    expect(screen.getByText(/A vitrine leva alguns minutos para mostrar a mudança\./)).toBeInTheDocument();
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
    acceptNewSocialNetworks();
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
    apiDatabase.socialNetworks.push({ id: 3, descricao: 'Minha Loja', link: 'loja.com' });
    const user = userEvent.setup();
    renderPanel([...socialNetworks, { id: 3, name: 'Minha Loja', url: 'loja.com' }]);

    await user.click(screen.getByRole('button', { name: 'Editar Minha Loja' }));
    expect(screen.getByLabelText('Nome da rede')).toHaveValue('Minha Loja');
    expect(screen.getByLabelText('Link')).toHaveValue('loja.com');
    await fillForm(user, 'Minha Loja', 'https://loja.com');

    expect(await screen.findByText('https://loja.com')).toBeInTheDocument();
    expect(screen.queryByText('Link sem https, não aparece na vitrine')).not.toBeInTheDocument();
    expect(apiDatabase.socialNetworks).toContainEqual({ id: 3, descricao: 'Minha Loja', link: 'https://loja.com' });
    expect(apiRequests).toEqual(['PUT /api/socialnetwork/Minha%20Loja']);
  });

  it('sends only the link when the original name was kept, even with odd spacing', async () => {
    apiDatabase.socialNetworks.push({ id: 3, descricao: 'Minha  Loja', link: 'loja.com' });
    const user = userEvent.setup();
    renderPanel([...socialNetworks, { id: 3, name: 'Minha  Loja', url: 'loja.com' }]);

    await user.click(screen.getByRole('button', { name: /Editar Minha/ }));
    await user.clear(screen.getByLabelText('Link'));
    await user.type(screen.getByLabelText('Link'), 'https://loja.com');
    await user.click(screen.getByRole('button', { name: 'Salvar rede' }));

    expect(await screen.findByText('https://loja.com')).toBeInTheDocument();
    expect(apiDatabase.socialNetworks).toContainEqual({ id: 3, descricao: 'Minha  Loja', link: 'https://loja.com' });
  });

  it('renames a social network when the api accepts the new name', async () => {
    server.use(
      http.put('*/socialnetwork/:description', () =>
        HttpResponse.json({ id: 2, descricao: 'Shopee Oficial', link: 'https://shopee.com.br/multikoisas' }),
      ),
    );
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Editar Shopee' }));
    await fillForm(user, 'Shopee Oficial', 'https://shopee.com.br/multikoisas');

    expect(await screen.findByText('Shopee Oficial')).toBeInTheDocument();
    expect(screen.getByText('2 redes cadastradas')).toBeInTheDocument();
  });

  it('shows a repeated name when the api refuses the rename as already registered', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Editar Shopee' }));
    await fillForm(user, 'Shopee Oficial', 'https://shopee.com.br/multikoisas');

    expect(await screen.findByText('Já existe uma rede com esse nome.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome da rede')).toBeInTheDocument();
  });

  it('reloads the list when the network was changed in another tab', async () => {
    const user = userEvent.setup();
    renderPanel([...socialNetworks, { id: 9, name: 'TikTok', url: 'https://tiktok.com/@multikoisas' }]);

    await user.click(screen.getByRole('button', { name: 'Editar TikTok' }));
    await fillForm(user, 'TikTok', 'https://tiktok.com/@mk');

    expect(await screen.findByText('Essa rede foi alterada em outra aba. Recarregue a lista.')).toHaveAttribute(
      'role',
      'alert',
    );
    expect(screen.queryByLabelText('Nome da rede')).not.toBeInTheDocument();
    expect(screen.getByText('2 redes cadastradas')).toBeInTheDocument();
    expect(apiRequests).toEqual(['PUT /api/socialnetwork/TikTok', 'GET /api/socialnetwork']);
  });

  it('keeps the form open with a generic message on another 409 from the edit', async () => {
    respondWith('put', '*/socialnetwork/:description', 409);
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Editar Shopee' }));
    await fillForm(user, 'Shopee', 'https://shopee.com.br/loja');

    expect(await screen.findByText('Não foi possível salvar a rede. Tente de novo.')).toBeInTheDocument();
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
    expect(apiDatabase.socialNetworks.map((socialNetwork) => socialNetwork.descricao)).toEqual(['Instagram']);
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
