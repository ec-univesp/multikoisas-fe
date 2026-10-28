import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/msw/server';
import { SiteFooter } from './SiteFooter';

describe('SiteFooter', () => {
  it('shows the store name and the current year', async () => {
    render(await SiteFooter());
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(/multikoisas —/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
  });

  it('links each store social network in a new tab', async () => {
    render(await SiteFooter());
    expect(screen.getByRole('heading', { name: 'Siga a MultiKoisas' })).toBeInTheDocument();
    const instagram = screen.getByRole('link', { name: 'Instagram' });
    expect(instagram).toHaveAttribute('href', 'https://www.instagram.com/multikoisas');
    expect(instagram).toHaveAttribute('target', '_blank');
    expect(instagram).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'Shopee' })).toHaveAttribute('href', 'https://shopee.com.br/multikoisas');
  });

  it('keeps the footer without social networks when the api fails', async () => {
    server.use(http.get('*/socialnetwork', () => new HttpResponse(null, { status: 500 })));
    render(await SiteFooter());
    expect(screen.getByText(/multikoisas —/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Siga a MultiKoisas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
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
    server.use(http.get('*/socialnetwork', () => HttpResponse.json([])));
    render(await SiteFooter());
    expect(screen.queryByRole('heading', { name: 'Siga a MultiKoisas' })).not.toBeInTheDocument();
  });
});
