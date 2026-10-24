import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { recordApiRequests, server } from '@/test/msw/server';
import { CategoryAdminScreen } from './CategoryAdminScreen';

let apiRequests: string[] = [];

beforeEach(() => {
  apiRequests = recordApiRequests();
});

describe('CategoryAdminScreen', () => {
  it('loads the categories through the site proxy in the browser', async () => {
    render(<CategoryAdminScreen />);

    expect(screen.getByText('Carregando categorias...')).toBeInTheDocument();
    expect(await screen.findByText('Banheiros')).toBeInTheDocument();
    expect(apiRequests).toEqual(['GET /api/categoria']);
  });

  it('offers a retry when the api fails to load', async () => {
    server.use(http.get('*/categoria', () => new HttpResponse(null, { status: 500 }), { once: true }));
    const user = userEvent.setup();
    render(<CategoryAdminScreen />);

    expect(await screen.findByText('Não foi possível carregar as categorias.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Banheiros')).toBeInTheDocument();
  });
});
