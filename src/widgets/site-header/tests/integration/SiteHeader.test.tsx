import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { ShowcaseSearchProvider } from '@/features/showcase-filter';
import { apiDatabase, SUPABASE_IMAGES } from '@/test/msw/apiDatabase';
import { server } from '@/test/msw/server';
import { waitForLoaded } from '@/test/waitForLoaded';
import { SiteHeader } from '../../SiteHeader';

const SAVED_LOGO = `${SUPABASE_IMAGES}/logo.png`;

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const renderHeader = async () => {
  render(
    <ShowcaseSearchProvider>
      <SiteHeader />
    </ShowcaseSearchProvider>,
  );
  await waitForLoaded();
};

describe('SiteHeader', () => {
  it('marks the header busy and keeps the store strip line while the data loads', () => {
    render(
      <ShowcaseSearchProvider>
        <SiteHeader />
      </ShowcaseSearchProvider>,
    );
    expect(screen.getByRole('banner')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('stores-phrase-placeholder')).toHaveClass('h-5');
    expect(screen.getByRole('searchbox', { name: 'Buscar produto no cabeçalho' })).toBeInTheDocument();
  });

  it('shows the notice bar, the brand, the search and the section links', async () => {
    await renderHeader();
    expect(
      screen.getByText('Vitrine oficial MultiKoisas: escolha aqui e conclua a compra com segurança na loja parceira.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^multikoisas/i })).toHaveAttribute('href', '/');
    expect(screen.getByText('Tudo em um só lugar')).toBeInTheDocument();
    expect(screen.getByText('Multi')).toHaveClass('text-white');
    expect(screen.getByText('Koisas')).toHaveClass('text-store-yellow');
    expect(screen.getByText('Koisas').parentElement).not.toHaveTextContent('Tudo em um só lugar');
    expect(screen.getByRole('searchbox', { name: 'Buscar produto no cabeçalho' })).toHaveClass('text-base');
    expect(screen.getByRole('search', { name: 'Buscar produto no cabeçalho' })).toBeInTheDocument();
    const sectionLinks = within(screen.getByRole('navigation', { name: 'Seções do site' })).getAllByRole('link');
    expect(sectionLinks.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Início', '/'],
      ['Vitrine de produtos', '/showcase'],
    ]);
  });

  it('lines the tagline up with the brand mark text', async () => {
    await renderHeader();
    expect(screen.getByText('Tudo em um só lugar')).toHaveClass('ml-13');
  });

  it('lines the tagline up with the left edge of the saved logo', async () => {
    apiDatabase.storeImages.push({ id: 2, imagemUrl: SAVED_LOGO, tipo: 'LOGO' });
    await renderHeader();
    expect(await screen.findByRole('img', { name: 'MultiKoisas' })).toHaveAttribute('src', SAVED_LOGO);
    expect(screen.getByText('Tudo em um só lugar')).not.toHaveClass('ml-13');
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

  it('leaves whatsapp out of the header, since it floats on the page', async () => {
    server.use(
      http.get('*/socialnetwork', () =>
        HttpResponse.json([{ id: 3, descricao: 'WhatsApp', link: 'https://wa.me/5500000000000' }]),
      ),
    );
    await renderHeader();
    expect(screen.queryByRole('link', { name: 'Falar no WhatsApp' })).not.toBeInTheDocument();
  });

  it('leaves the google reviews badge out of the header, since it floats on the page', async () => {
    await renderHeader();
    expect(screen.queryByRole('link', { name: /no Google/ })).not.toBeInTheDocument();
  });

  it('shows the saved store logo', async () => {
    apiDatabase.storeImages.push({ id: 2, imagemUrl: SAVED_LOGO, tipo: 'LOGO' });
    await renderHeader();
    expect(await screen.findByRole('img', { name: 'MultiKoisas' })).toHaveAttribute('src', SAVED_LOGO);
  });
});
