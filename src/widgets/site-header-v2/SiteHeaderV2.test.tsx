import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { VitrineSearchProvider } from '@/features/vitrine-filter';
import { server } from '@/test/msw/server';
import { SiteHeaderV2 } from './SiteHeaderV2';

const renderHeader = async () => render(<VitrineSearchProvider>{await SiteHeaderV2()}</VitrineSearchProvider>);

describe('SiteHeaderV2', () => {
  it('shows the notice bar, the brand, the search and the section links', async () => {
    await renderHeader();
    expect(
      screen.getByText(
        'Vitrine oficial MultiKoisas: escolha aqui e conclua a compra com segurança na loja parceira.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^multikoisas/i })).toHaveAttribute('href', '/v2');
    expect(screen.getByText('Tudo em um só lugar')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Buscar produto' })).toHaveClass('text-base');
    expect(screen.getByRole('link', { name: 'Vitrine de produtos' })).toHaveAttribute('href', '#vitrine');
    expect(screen.getByRole('link', { name: 'Sobre a MultiKoisas' })).toHaveAttribute('href', '#sobre');
  });

  it('names only the stores that appear in the catalog links', async () => {
    await renderHeader();
    expect(screen.getByText('Compre na Shopee')).toBeInTheDocument();
    expect(screen.queryByText(/mercado livre/i)).not.toBeInTheDocument();
  });

  it('lists every catalog store in one sentence', async () => {
    server.use(
      http.get('*/canalvenda', () =>
        HttpResponse.json([
          { id: 2, nome: 'Shopee' },
          { id: 6, nome: 'Mercado Livre' },
        ]),
      ),
      http.get('*/canalvendaproduto', () =>
        HttpResponse.json([
          { produtoId: 1, canalVendaId: 2, link: 'https://shopee.com.br/garrafa' },
          { produtoId: 5, canalVendaId: 6, link: 'https://www.mercadolivre.com.br/balde' },
        ]),
      ),
    );
    await renderHeader();
    expect(screen.getByText('Compre na Shopee ou no Mercado Livre')).toBeInTheDocument();
  });

  it('hides the store strip when the catalog cannot be read', async () => {
    server.use(http.get('*/produto', () => new HttpResponse(null, { status: 500 })));
    await renderHeader();
    expect(screen.queryByText(/^Compre /)).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Buscar produto' })).toBeInTheDocument();
  });

  it('offers whatsapp only when the store has it among its social networks', async () => {
    await renderHeader();
    expect(screen.queryByRole('link', { name: 'Falar no WhatsApp' })).not.toBeInTheDocument();
  });

  it('links the store whatsapp in a new tab', async () => {
    server.use(
      http.get('*/socialnetwork', () =>
        HttpResponse.json([{ id: 3, descricao: 'WhatsApp', link: 'https://wa.me/5500000000000' }]),
      ),
    );
    await renderHeader();
    const whatsapp = screen.getByRole('link', { name: 'Falar no WhatsApp' });
    expect(whatsapp).toHaveAttribute('href', 'https://wa.me/5500000000000');
    expect(whatsapp).toHaveAttribute('target', '_blank');
    expect(whatsapp).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('keeps the header up when the social networks cannot be read', async () => {
    server.use(http.get('*/socialnetwork', () => new HttpResponse(null, { status: 500 })));
    await renderHeader();
    expect(screen.queryByRole('link', { name: 'Falar no WhatsApp' })).not.toBeInTheDocument();
  });
});
