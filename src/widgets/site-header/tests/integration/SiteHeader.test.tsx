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
  it('keeps the search while the data loads', () => {
    render(
      <ShowcaseSearchProvider>
        <SiteHeader />
      </ShowcaseSearchProvider>,
    );
    expect(screen.getByRole('searchbox', { name: 'Buscar produto no cabeçalho' })).toBeInTheDocument();
  });

  it('shows the notice bar, the brand, the search and the section links', async () => {
    await renderHeader();
    expect(
      screen.getByText('Vitrine oficial MultiKoisas: escolha aqui e conclua a compra com segurança na loja parceira.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^multikoisas/i })).toHaveAttribute('href', '/');
    expect(screen.getByText('Multi')).toHaveClass('text-white');
    expect(screen.getByText('Koisas')).toHaveClass('text-store-yellow');
    expect(screen.getByRole('searchbox', { name: 'Buscar produto no cabeçalho' })).toHaveClass('text-base');
    expect(screen.getByRole('search', { name: 'Buscar produto no cabeçalho' })).toBeInTheDocument();
    const sectionLinks = within(screen.getByRole('navigation', { name: 'Seções do site' })).getAllByRole('link');
    expect(sectionLinks.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Início', '/'],
      ['Vitrine de produtos', '/showcase'],
    ]);
  });

  it('leaves the slogan caption and the stores sentence out of the header', async () => {
    await renderHeader();
    expect(screen.queryByText('Tudo em um só lugar')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Compre /)).not.toBeInTheDocument();
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

  it('shows the saved store logo bigger, next to the store name', async () => {
    apiDatabase.storeImages.push({ id: 2, imagemUrl: SAVED_LOGO, tipo: 'LOGO' });
    server.use(
      http.get('*/loja', () =>
        HttpResponse.json([{ id: 1, nomeLoja: 'Loja da Ana', descricaoLoja: null, endereco: null }]),
      ),
    );
    const { container } = render(
      <ShowcaseSearchProvider>
        <SiteHeader />
      </ShowcaseSearchProvider>,
    );
    const homeLink = await screen.findByRole('link', { name: 'Loja da Ana' });
    expect(homeLink).toHaveAttribute('href', '/');
    expect(screen.getByText('Loja da Ana')).toHaveClass('font-bold', 'text-store-yellow', 'uppercase');
    const logo = container.querySelector(`img[src="${SAVED_LOGO}"]`);
    expect(logo).toHaveClass('h-14');
    expect(logo).toHaveAttribute('alt', '');
    expect(screen.queryByText('Tudo em um só lugar')).not.toBeInTheDocument();
  });

  it('names the store MultiKoisas next to the logo when the store row is missing', async () => {
    apiDatabase.storeImages.push({ id: 2, imagemUrl: SAVED_LOGO, tipo: 'LOGO' });
    apiDatabase.stores = [];
    render(
      <ShowcaseSearchProvider>
        <SiteHeader />
      </ShowcaseSearchProvider>,
    );
    expect(await screen.findByRole('link', { name: 'MultiKoisas' })).toHaveAttribute('href', '/');
  });
});
