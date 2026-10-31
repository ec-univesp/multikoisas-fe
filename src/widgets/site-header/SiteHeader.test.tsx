import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { VitrineSearchProvider } from '@/features/vitrine-filter';
import { server } from '@/test/msw/server';
import { SiteHeader } from './SiteHeader';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const renderHeader = async () => render(<VitrineSearchProvider>{await SiteHeader()}</VitrineSearchProvider>);

describe('SiteHeader', () => {
  it('shows the notice bar, the brand, the search and the section links', async () => {
    await renderHeader();
    expect(
      screen.getByText(
        'Vitrine oficial MultiKoisas: escolha aqui e conclua a compra com segurança na loja parceira.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^multikoisas/i })).toHaveAttribute('href', '/');
    expect(screen.getByText('Tudo em um só lugar')).toBeInTheDocument();
    expect(screen.getByText('Multi')).toHaveClass('text-white');
    expect(screen.getByText('Koisas')).toHaveClass('text-store-yellow');
    expect(screen.getByText('Koisas').parentElement).not.toHaveTextContent('Tudo em um só lugar');
    expect(screen.getByRole('searchbox', { name: 'Buscar produto no cabeçalho' })).toHaveClass('text-base');
    expect(screen.getByRole('search', { name: 'Buscar produto no cabeçalho' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vitrine de produtos' })).toHaveAttribute('href', '/#vitrine');
    expect(screen.getByRole('link', { name: 'Sobre a MultiKoisas' })).toHaveAttribute('href', '/#sobre');
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
    expect(screen.getByRole('searchbox', { name: 'Buscar produto no cabeçalho' })).toBeInTheDocument();
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

  it('recognizes whatsapp by its address whatever the network is called', async () => {
    server.use(
      http.get('*/socialnetwork', () =>
        HttpResponse.json([
          { id: 4, descricao: 'Contato', link: 'https://api.whatsapp.com/send?phone=5500000000000' },
        ]),
      ),
    );
    await renderHeader();
    expect(screen.getByRole('link', { name: 'Falar no WhatsApp' })).toHaveAttribute(
      'href',
      'https://api.whatsapp.com/send?phone=5500000000000',
    );
  });

  it('ignores a network named whatsapp that points somewhere else', async () => {
    server.use(
      http.get('*/socialnetwork', () =>
        HttpResponse.json([{ id: 3, descricao: 'WhatsApp', link: 'https://example.com/wa.me/5500000000000' }]),
      ),
    );
    await renderHeader();
    expect(screen.queryByRole('link', { name: 'Falar no WhatsApp' })).not.toBeInTheDocument();
  });

  it('ignores a whatsapp address that is not a valid https link', async () => {
    server.use(
      http.get('*/socialnetwork', () =>
        HttpResponse.json([
          { id: 3, descricao: 'WhatsApp', link: 'wa.me/5500000000000' },
          { id: 5, descricao: 'WhatsApp', link: 'http://wa.me/5500000000000' },
        ]),
      ),
    );
    await renderHeader();
    expect(screen.queryByRole('link', { name: 'Falar no WhatsApp' })).not.toBeInTheDocument();
  });

  it('keeps the header up when the social networks cannot be read', async () => {
    server.use(http.get('*/socialnetwork', () => new HttpResponse(null, { status: 500 })));
    await renderHeader();
    expect(screen.queryByRole('link', { name: 'Falar no WhatsApp' })).not.toBeInTheDocument();
  });
});
