import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/msw/server';
import { SiteFooter } from '../../SiteFooter';

describe('SiteFooter', () => {
  it('presents the store with its brand, a short description, the year and the partner stores notice', async () => {
    render(await SiteFooter());
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByText('Koisas')).toBeInTheDocument();
    expect(
      within(footer).getByText('Utilidades para casa, cozinha, limpeza e organização, num lugar só.'),
    ).toBeInTheDocument();
    expect(
      within(footer).getByText(
        `© ${new Date().getFullYear()} MultiKoisas. A venda e a entrega são feitas pelas lojas parceiras.`,
      ),
    ).toBeInTheDocument();
  });

  it('offers shortcuts to the home page, the product showcase and the store section', async () => {
    render(await SiteFooter());
    const shortcuts = screen.getByRole('navigation', { name: 'Navegue' });
    expect(within(shortcuts).getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/');
    expect(within(shortcuts).getByRole('link', { name: 'Vitrine de produtos' })).toHaveAttribute('href', '/vitrine');
    expect(within(shortcuts).getByRole('link', { name: 'A loja' })).toHaveAttribute('href', '/#sobre');
  });

  it('links each store social network in a new tab with its icon', async () => {
    render(await SiteFooter());
    const socialNetworks = screen.getByRole('navigation', { name: 'Siga a MultiKoisas' });
    const instagram = within(socialNetworks).getByRole('link', { name: 'Instagram' });
    expect(instagram).toHaveAttribute('href', 'https://www.instagram.com/multikoisas');
    expect(instagram).toHaveAttribute('target', '_blank');
    expect(instagram).toHaveAttribute('rel', 'noopener noreferrer');
    expect(instagram.querySelector('svg')).toHaveAttribute('data-icon', 'instagram');
    expect(within(socialNetworks).getByRole('link', { name: 'Shopee' })).toHaveAttribute(
      'href',
      'https://shopee.com.br/multikoisas',
    );
  });

  it('keeps the footer and its shortcuts without social networks when the api fails', async () => {
    server.use(http.get('*/socialnetwork', () => new HttpResponse(null, { status: 500 })));
    render(await SiteFooter());
    expect(screen.getByRole('navigation', { name: 'Navegue' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Siga a MultiKoisas' })).not.toBeInTheDocument();
  });

  it('leaves out a social network whose link is not https', async () => {
    server.use(
      http.get('*/socialnetwork', () =>
        HttpResponse.json([
          { id: 1, descricao: 'Instagram', link: 'https://www.instagram.com/multikoisas' },
          { id: 2, descricao: 'Site', link: 'http://multikoisas.com.br' },
        ]),
      ),
    );
    render(await SiteFooter());
    expect(screen.getByRole('link', { name: 'Instagram' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Site' })).not.toBeInTheDocument();
  });

  it('hides the social networks block when the store has none', async () => {
    server.use(http.get('*/socialnetwork', () => new HttpResponse(null, { status: 404 })));
    render(await SiteFooter());
    expect(screen.queryByRole('navigation', { name: 'Siga a MultiKoisas' })).not.toBeInTheDocument();
  });
});
