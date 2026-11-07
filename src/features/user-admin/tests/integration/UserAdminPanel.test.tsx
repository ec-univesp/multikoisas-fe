import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApiHandlers } from '@/shared/local-api/handlers';
import { createMemoryImageStore } from '@/shared/local-api/imageStore';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { recordApiRequests, server } from '@/test/msw/server';
import { UserAdminPanel } from '../../UserAdminPanel';
import type { UserAccount } from '../../userApi';

const admin: UserAccount = { id: 8, username: 'admin', email: 'pi2alunos@gmail.com', role: 'ADMIN' };
const maria: UserAccount = { id: 9, username: 'maria', email: 'maria@multikoisas.com', role: 'USER' };

let apiRequests: string[] = [];

beforeEach(() => {
  apiDatabase.users.push({ ...maria });
  apiRequests = recordApiRequests();
});

const renderPanel = (initialUsers: UserAccount[] = [admin, maria]) =>
  render(<UserAdminPanel initialUsers={initialUsers} />);

type Session = ReturnType<typeof userEvent.setup>;

type FormValues = { username?: string; email?: string; password?: string; role?: string };

const fillForm = async (session: Session, { username, email, password, role }: FormValues) => {
  if (username !== undefined) await session.type(screen.getByLabelText('Nome de usuário'), username);
  if (email !== undefined) {
    await session.clear(screen.getByLabelText('E-mail'));
    if (email) await session.type(screen.getByLabelText('E-mail'), email);
  }
  if (password) await session.type(screen.getByLabelText('Senha'), password);
  if (role) await session.selectOptions(screen.getByLabelText('Perfil'), role);
  await session.click(screen.getByRole('button', { name: 'Salvar usuário' }));
};

const waitForFormToClose = () => waitFor(() => expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument());

const submitNewUser = async (session: Session, values: FormValues) => {
  await session.click(screen.getByRole('button', { name: 'Novo usuário' }));
  await fillForm(session, values);
};

const recordRequestBodies = () => {
  const bodies: unknown[] = [];
  server.events.on('request:start', async ({ request }) => {
    if (request.body) bodies.push(await request.clone().json());
  });
  return bodies;
};

const NEW_USER = { username: 'joao', email: 'joao@multikoisas.com', password: 'segredo' };

describe('UserAdminPanel', () => {
  it('lists the users with e-mail, profile and count', () => {
    renderPanel([
      admin,
      { ...maria, role: 'admin' },
      { id: 10, username: 'ana', email: 'ana@x.com', role: 'qualquer' },
    ]);

    expect(screen.getByText('3 usuários cadastrados')).toBeInTheDocument();
    expect(screen.getByText('maria@multikoisas.com')).toBeInTheDocument();
    expect(screen.getAllByText('Administrador')).toHaveLength(2);
    expect(screen.getByRole('cell', { name: 'Usuário' })).toBeInTheDocument();
  });

  it('uses the singular count and shows the empty state', () => {
    const { unmount } = renderPanel([admin]);
    expect(screen.getByText('1 usuário cadastrado')).toBeInTheDocument();
    unmount();

    renderPanel([]);
    expect(screen.getByText('Nenhum usuário cadastrado.')).toBeInTheDocument();
  });

  it('creates the user and reloads the list to show it', async () => {
    const session = userEvent.setup();
    renderPanel();

    await submitNewUser(session, { ...NEW_USER, role: 'Administrador' });

    expect(await screen.findByText('joao@multikoisas.com')).toBeInTheDocument();
    expect(screen.getByText('3 usuários cadastrados')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nome de usuário')).not.toBeInTheDocument();
    expect(apiDatabase.users).toContainEqual({
      id: 100,
      username: 'joao',
      email: 'joao@multikoisas.com',
      role: 'ADMIN',
    });
    expect(apiRequests).toEqual(['POST /api/user', 'GET /api/user']);
  });

  it('creates a regular user by default', async () => {
    const session = userEvent.setup();
    renderPanel();

    await submitNewUser(session, NEW_USER);

    expect(await screen.findByText('joao@multikoisas.com')).toBeInTheDocument();
    expect(apiDatabase.users).toContainEqual(expect.objectContaining({ username: 'joao', role: 'USER' }));
  });

  it('requires username, e-mail and password before calling the api', async () => {
    const session = userEvent.setup();
    renderPanel();

    await submitNewUser(session, {});

    expect(screen.getByText('Informe o nome de usuário.')).toHaveAttribute('role', 'alert');
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument();
    expect(apiRequests).toEqual([]);
  });

  it.each(['joao silva', 'joao/x', '..'])('rejects the username "%s" that breaks the address', async (username) => {
    const session = userEvent.setup();
    renderPanel();

    await submitNewUser(session, { ...NEW_USER, username });

    expect(screen.getByText('Use só letras, números, ponto, hífen ou sublinhado.')).toBeInTheDocument();
    expect(apiRequests).toEqual([]);
  });

  it('shows a username taken by another user', async () => {
    const session = userEvent.setup();
    renderPanel();

    await submitNewUser(session, { ...NEW_USER, username: 'maria' });

    expect(await screen.findByText('Este nome de usuário já está em uso.')).toHaveAttribute('role', 'alert');
    expect(screen.getByLabelText('Nome de usuário')).toBeInTheDocument();
  });

  it('shows an e-mail taken by another user', async () => {
    const session = userEvent.setup();
    renderPanel();

    await submitNewUser(session, { ...NEW_USER, email: 'maria@multikoisas.com' });

    expect(await screen.findByText('Este e-mail já está em uso.')).toHaveAttribute('role', 'alert');
    expect(screen.queryByText('Este nome de usuário já está em uso.')).not.toBeInTheDocument();
  });

  it('keeps the form open with a fixed generic message when the api fails to save', async () => {
    server.use(http.post('*/user', () => HttpResponse.text('NullPointerException', { status: 500 })));
    const session = userEvent.setup();
    renderPanel();

    await submitNewUser(session, NEW_USER);

    expect(await screen.findByText('Não foi possível salvar o usuário. Tente de novo.')).toBeInTheDocument();
    expect(screen.queryByText('NullPointerException')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nome de usuário')).toBeInTheDocument();
  });

  it('asks for a page reload when the user was saved but the list failed to reload', async () => {
    server.use(http.get('*/user', () => new HttpResponse(null, { status: 500 })));
    const session = userEvent.setup();
    renderPanel();

    await submitNewUser(session, NEW_USER);

    expect(
      await screen.findByText('O usuário foi salvo, mas a lista não atualizou. Recarregue a página.'),
    ).toHaveAttribute('role', 'alert');
  });

  it('blocks cancel and a second submit while the user is being saved', async () => {
    server.use(http.post('*/user', () => delay('infinite')));
    const session = userEvent.setup();
    renderPanel();

    await submitNewUser(session, NEW_USER);

    expect(await screen.findByRole('button', { name: 'Salvando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    await session.keyboard('{Escape}');
    expect(screen.getByLabelText('Nome de usuário')).toBeInTheDocument();
  });

  it('closes the form on cancel', async () => {
    const session = userEvent.setup();
    renderPanel();

    await session.click(screen.getByRole('button', { name: 'Novo usuário' }));
    await session.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByLabelText('Nome de usuário')).not.toBeInTheDocument();
  });

  it('edits the e-mail and keeps the password when left blank', async () => {
    const bodies = recordRequestBodies();
    const session = userEvent.setup();
    renderPanel();

    await session.click(screen.getByRole('button', { name: 'Editar maria' }));
    expect(screen.getByLabelText('Nome de usuário')).toHaveValue('maria');
    expect(screen.getByLabelText('Nome de usuário')).toBeDisabled();
    expect(screen.getByLabelText('Senha')).toHaveAttribute('placeholder', 'Deixe em branco para manter');
    expect(screen.getByLabelText('Perfil')).toHaveValue('USER');
    await fillForm(session, { email: 'maria@nova.com' });

    expect(await screen.findByText('maria@nova.com')).toBeInTheDocument();
    expect(apiRequests).toEqual(['PUT /api/user/maria']);
    expect(bodies).toEqual([{ email: 'maria@nova.com', role: 'USER' }]);
  });

  it('sends the new password when filled on edit', async () => {
    const bodies = recordRequestBodies();
    const session = userEvent.setup();
    renderPanel();

    await session.click(screen.getByRole('button', { name: 'Editar maria' }));
    await fillForm(session, { password: 'nova-senha' });

    await waitForFormToClose();
    expect(bodies).toEqual([{ email: 'maria@multikoisas.com', role: 'USER', password: 'nova-senha' }]);
  });

  it('shows the new profile after changing the role', async () => {
    server.use(
      ...createApiHandlers(apiDatabase, {
        onChange: () => true,
        images: createMemoryImageStore(),
        imageUrl: String,
        reproduceApiBugs: false,
      }),
    );
    const session = userEvent.setup();
    renderPanel();

    await session.click(screen.getByRole('button', { name: 'Editar maria' }));
    await fillForm(session, { role: 'Administrador' });

    await waitForFormToClose();
    expect(screen.getAllByText('Administrador')).toHaveLength(2);
    expect(apiDatabase.users).toContainEqual({ ...maria, role: 'ADMIN' });
  });

  it('shows an e-mail taken by another user on edit', async () => {
    server.use(
      http.put('*/user/:username', () =>
        HttpResponse.text('Este e-mail já está em uso por outra conta.', { status: 409 }),
      ),
    );
    const session = userEvent.setup();
    renderPanel();

    await session.click(screen.getByRole('button', { name: 'Editar maria' }));
    await fillForm(session, { email: 'pi2alunos@gmail.com' });

    expect(await screen.findByText('Este e-mail já está em uso.')).toBeInTheDocument();
  });

  it('shows the generic message when the user to edit is gone', async () => {
    const session = userEvent.setup();
    renderPanel([admin, { ...maria, username: 'sumiu' }]);

    await session.click(screen.getByRole('button', { name: 'Editar sumiu' }));
    await fillForm(session, { email: 'sumiu@x.com' });

    expect(await screen.findByText('Não foi possível salvar o usuário. Tente de novo.')).toBeInTheDocument();
  });

  it('keeps the user when the deletion is cancelled', async () => {
    const session = userEvent.setup();
    renderPanel();

    await session.click(screen.getByRole('button', { name: 'Apagar maria' }));
    await session.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByText('maria')).toBeInTheDocument();
    expect(apiRequests).toEqual([]);
  });

  it('deletes the user in the api after confirmation', async () => {
    const session = userEvent.setup();
    renderPanel();

    await session.click(screen.getByRole('button', { name: 'Apagar maria' }));
    await session.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByText('1 usuário cadastrado')).toBeInTheDocument();
    expect(screen.queryByText('maria')).not.toBeInTheDocument();
    expect(apiDatabase.users.map((user) => user.username)).toEqual(['admin']);
    expect(apiRequests).toEqual(['DELETE /api/user/maria']);
  });

  it('drops a user that was already deleted elsewhere (api answers 404)', async () => {
    const session = userEvent.setup();
    renderPanel([admin, maria, { id: 11, username: 'ana', email: 'ana@x.com', role: 'USER' }]);

    await session.click(screen.getByRole('button', { name: 'Apagar ana' }));
    await session.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByText('2 usuários cadastrados')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the user with a generic message on other delete failures', async () => {
    server.use(http.delete('*/user/:username', () => new HttpResponse(null, { status: 401 })));
    const session = userEvent.setup();
    renderPanel();

    await session.click(screen.getByRole('button', { name: 'Apagar maria' }));
    await session.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(
      await screen.findByText('Não foi possível apagar o usuário. Recarregue a página e tente de novo.'),
    ).toBeInTheDocument();
    expect(screen.getByText('maria')).toBeInTheDocument();
  });

  it('blocks cancel, Escape and a second confirmation while the user is being deleted', async () => {
    server.use(http.delete('*/user/:username', () => delay('infinite')));
    const session = userEvent.setup();
    renderPanel();

    await session.click(screen.getByRole('button', { name: 'Apagar maria' }));
    await session.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByRole('button', { name: 'Apagando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    await session.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Apagando...' })).toBeInTheDocument();
  });
});
