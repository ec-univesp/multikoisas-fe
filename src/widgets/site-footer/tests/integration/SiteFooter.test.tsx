import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { StoreSettingsValues } from '@/entities/store-settings';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { server } from '@/test/msw/server';
import { waitForLoaded } from '@/test/waitForLoaded';
import { SiteFooter } from '../../SiteFooter';

const renderFooter = async (props: { settings?: StoreSettingsValues } = {}) => {
  render(<SiteFooter {...props} />);
  await waitForLoaded();
};

describe('SiteFooter', () => {
  it('marks the footer busy while the social networks load', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('contentinfo')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('navigation', { name: 'Navegue' })).toBeInTheDocument();
  });

  it('presents the store with its brand, a short description, the year and the partner stores notice', async () => {
    await renderFooter();
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

  it('offers shortcuts to the home page and the product showcase', async () => {
    await renderFooter();
    const shortcuts = screen.getByRole('navigation', { name: 'Navegue' });
    expect(within(shortcuts).getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/');
    expect(within(shortcuts).getByRole('link', { name: 'Vitrine de produtos' })).toHaveAttribute('href', '/showcase');
    expect(within(shortcuts).getAllByRole('link')).toHaveLength(2);
  });

  it('links each store social network in a new tab with its icon', async () => {
    await renderFooter();
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
    await renderFooter();
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
    await renderFooter();
    expect(screen.getByRole('link', { name: 'Instagram' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Site' })).not.toBeInTheDocument();
  });

  it('shows the store address when it is registered', async () => {
    const settings: StoreSettingsValues = {
      address: 'Rua das Flores, 100 - São Paulo, SP',
      googleReviewsUrl: null,
      googleRating: null,
      googleReviewCount: null,
    };
    await renderFooter({ settings });
    const address = within(screen.getByRole('contentinfo')).getByText('Rua das Flores, 100 - São Paulo, SP');
    expect(address.tagName).toBe('ADDRESS');
  });

  it('leaves out the address when none is registered', async () => {
    await renderFooter({
      settings: { address: null, googleReviewsUrl: null, googleRating: null, googleReviewCount: null },
    });
    expect(screen.getByRole('contentinfo').querySelector('address')).not.toBeInTheDocument();
  });

  it('hides the social networks block when the store has none', async () => {
    server.use(http.get('*/socialnetwork', () => new HttpResponse(null, { status: 404 })));
    await renderFooter();
    expect(screen.queryByRole('navigation', { name: 'Siga a MultiKoisas' })).not.toBeInTheDocument();
  });

  it('shows the saved address and logo when no settings are given', async () => {
    apiDatabase.storeSettings.address = 'Rua Nova, 10 - Santo André - SP';
    apiDatabase.storeSettings.logoUrl = '/local-images/5';
    render(<SiteFooter />);
    const footer = screen.getByRole('contentinfo');
    expect(await within(footer).findByText('Rua Nova, 10 - Santo André - SP')).toBeInTheDocument();
    expect(within(footer).getByRole('img', { name: 'MultiKoisas' })).toHaveAttribute('src', '/local-images/5');
  });
});
