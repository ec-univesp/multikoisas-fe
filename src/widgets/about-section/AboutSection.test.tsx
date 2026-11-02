import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/msw/server';
import { AboutSection } from './AboutSection';

const whatsAppNetwork = { id: 3, descricao: 'WhatsApp', link: 'https://wa.me/5500000000000' };
const instagramNetwork = { id: 1, descricao: 'Instagram', link: 'https://www.instagram.com/multikoisas' };

describe('AboutSection', () => {
  it('opens the page with the store as the single page title, anchored for the header link', async () => {
    const { container } = render(await AboutSection());
    expect(container.querySelector('section#sobre')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'MultiKoisas: utilidades para casa, cozinha, limpeza e organização',
      }),
    ).toBeInTheDocument();
  });

  it('links the real store social networks in a new tab', async () => {
    render(await AboutSection());
    const instagram = screen.getByRole('link', { name: 'Instagram' });
    expect(instagram).toHaveAttribute('href', 'https://www.instagram.com/multikoisas');
    expect(instagram).toHaveAttribute('target', '_blank');
    expect(instagram).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'Shopee' })).toHaveAttribute('href', 'https://shopee.com.br/multikoisas');
  });

  it('highlights whatsapp as the yellow contact button instead of a plain network link', async () => {
    server.use(http.get('*/socialnetwork', () => HttpResponse.json([instagramNetwork, whatsAppNetwork])));
    render(await AboutSection());
    const whatsApp = screen.getByRole('link', { name: 'Falar no WhatsApp' });
    expect(whatsApp).toHaveAttribute('href', 'https://wa.me/5500000000000');
    expect(whatsApp).toHaveAttribute('target', '_blank');
    expect(whatsApp).toHaveClass('bg-store-yellow');
    expect(screen.queryByRole('link', { name: 'WhatsApp' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Instagram' })).toBeInTheDocument();
  });

  it('keeps the text without links when the social networks cannot be read', async () => {
    server.use(http.get('*/socialnetwork', () => new HttpResponse(null, { status: 500 })));
    render(await AboutSection());
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('shows the store identity in place of the photo while there is none, without a coming soon note', async () => {
    const { container } = render(await AboutSection());
    const brandTile = screen.getByRole('img', { name: 'MultiKoisas' });
    expect(brandTile).toHaveClass('bg-store-navy');
    expect(within(brandTile).getByText('Koisas')).toHaveClass('text-store-yellow');
    expect(container.textContent).not.toMatch(/em breve/i);
  });

  it('shows the store photo once it is configured', async () => {
    render(await AboutSection({ storePhoto: { src: '/images/loja/fachada.jpg', alt: 'Fachada da loja MultiKoisas' } }));
    expect(screen.getByAltText('Fachada da loja MultiKoisas')).toHaveAttribute(
      'src',
      expect.stringContaining('fachada.jpg'),
    );
    expect(screen.queryByRole('img', { name: 'MultiKoisas' })).not.toBeInTheDocument();
  });

  it('never invents a phone, address or company id', async () => {
    const { container } = render(await AboutSection());
    expect(container.textContent).not.toMatch(/R\$|\(11\)|\d{4}-\d{4}|CNPJ|NF-e|balcão|logística|rua |avenida/i);
  });
});
