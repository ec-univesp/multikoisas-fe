import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { recordApiRequests, server } from '@/test/msw/server';
import { SocialNetworkAdminScreen } from '../../SocialNetworkAdminScreen';

let apiRequests: string[] = [];

beforeEach(() => {
  apiRequests = recordApiRequests();
});

describe('SocialNetworkAdminScreen', () => {
  it('loads every social network through the site proxy, including links the storefront hides', async () => {
    apiDatabase.redesSociais.push({ id: 3, descricao: 'WhatsApp', link: 'wa.me/5511999999999' });
    render(<SocialNetworkAdminScreen />);

    expect(screen.getByText('Carregando redes sociais...')).toBeInTheDocument();
    expect(await screen.findByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Link sem https, não aparece na vitrine')).toBeInTheDocument();
    expect(screen.getByText('3 redes cadastradas')).toBeInTheDocument();
    expect(apiRequests).toEqual(['GET /api/socialnetwork']);
  });

  it('shows the empty state when the api answers the empty list with 404', async () => {
    apiDatabase.redesSociais = [];
    render(<SocialNetworkAdminScreen />);

    expect(await screen.findByText('Nenhuma rede cadastrada.')).toBeInTheDocument();
  });

  it('offers a retry when the api fails to load', async () => {
    server.use(http.get('*/socialnetwork', () => new HttpResponse(null, { status: 500 }), { once: true }));
    const user = userEvent.setup();
    render(<SocialNetworkAdminScreen />);

    expect(await screen.findByText('Não foi possível carregar as redes sociais.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Instagram')).toBeInTheDocument();
  });
});
