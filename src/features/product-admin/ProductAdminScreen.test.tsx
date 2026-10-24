import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { recordApiRequests, server } from '@/test/msw/server';
import { ProductAdminScreen } from './ProductAdminScreen';

let apiRequests: string[] = [];

beforeEach(() => {
  apiRequests = recordApiRequests();
});

describe('ProductAdminScreen', () => {
  it('loads products and categories through the site proxy in the browser', async () => {
    render(<ProductAdminScreen />);

    expect(screen.getByText('Carregando produtos...')).toBeInTheDocument();
    expect(await screen.findByText('Garrafa Térmica 1L')).toBeInTheDocument();
    expect(screen.getByText('3 produtos cadastrados')).toBeInTheDocument();
    expect([...apiRequests].sort()).toEqual([
      'GET /api/categoria',
      'GET /api/categoriaproduto',
      'GET /api/imagem',
      'GET /api/produto',
    ]);
  });

  it('shows the first api photo as the table thumbnail', async () => {
    render(<ProductAdminScreen />);

    expect(await screen.findByAltText('Garrafa Térmica 1L')).toHaveAttribute(
      'src',
      expect.stringContaining('garrafa-frente.webp'),
    );
    expect(screen.getByAltText('Balde 12L')).toHaveAttribute('src', expect.stringContaining('placeholder'));
  });

  it('offers a retry when the api fails to load', async () => {
    server.use(http.get('*/produto', () => new HttpResponse(null, { status: 500 }), { once: true }));
    const user = userEvent.setup();
    render(<ProductAdminScreen />);

    expect(await screen.findByText('Não foi possível carregar os produtos.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Garrafa Térmica 1L')).toBeInTheDocument();
  });
});
