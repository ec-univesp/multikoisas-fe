import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { recordApiRequests, server } from '@/test/msw/server';
import { UserAdminScreen } from '../../UserAdminScreen';

let apiRequests: string[] = [];

beforeEach(() => {
  apiRequests = recordApiRequests();
});

describe('UserAdminScreen', () => {
  it('loads every user through the site proxy', async () => {
    apiDatabase.users.push({ id: 9, username: 'maria', email: 'maria@multikoisas.com', role: 'user' });
    render(<UserAdminScreen />);

    expect(screen.getByText('Carregando usuários...')).toBeInTheDocument();
    expect(await screen.findByText('maria')).toBeInTheDocument();
    expect(screen.getByText('2 usuários cadastrados')).toBeInTheDocument();
    expect(apiRequests).toEqual(['GET /api/user']);
  });

  it('shows the empty state when the api answers the empty list with 404', async () => {
    apiDatabase.users = [];
    render(<UserAdminScreen />);

    expect(await screen.findByText('Nenhum usuário cadastrado.')).toBeInTheDocument();
  });

  it('offers a retry when the api fails to load', async () => {
    server.use(http.get('*/user', () => new HttpResponse(null, { status: 500 }), { once: true }));
    const user = userEvent.setup();
    render(<UserAdminScreen />);

    expect(await screen.findByText('Não foi possível carregar os usuários.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('pi2alunos@gmail.com')).toBeInTheDocument();
  });
});
