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

  it('hides the social networks block when the store has none', async () => {
    server.use(http.get('*/socialnetwork', () => HttpResponse.json([])));
    render(await SiteFooter());
    expect(screen.queryByRole('heading', { name: 'Siga a MultiKoisas' })).not.toBeInTheDocument();
  });
});
