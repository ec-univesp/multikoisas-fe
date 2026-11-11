import { render, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiDatabase, SUPABASE_IMAGES } from '@/test/msw/apiDatabase';
import { server } from '@/test/msw/server';
import { waitForApiAnswers, waitForLoaded } from '@/test/waitForLoaded';
import { AboutSection } from '../../AboutSection';

const whatsAppNetwork = { id: 3, descricao: 'WhatsApp', link: 'https://wa.me/5500000000000' };
const instagramNetwork = { id: 1, descricao: 'Instagram', link: 'https://www.instagram.com/multikoisas' };

const FALLBACK_DESCRIPTION =
  'A MultiKoisas é uma loja de utilidades para casa, cozinha, limpeza, ferragens e organização.';

const renderAbout = async () => {
  const view = render(<AboutSection />);
  await waitForLoaded();
  return view;
};

describe('AboutSection', () => {
  it('shows the store text right away and marks the section busy while the social networks load', () => {
    const { container } = render(<AboutSection />);
    expect(container.querySelector('section#about')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('opens the page with the store as the single page title, anchored for the header link', async () => {
    const { container } = await renderAbout();
    expect(container.querySelector('section#about')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'MultiKoisas: utilidades para casa, cozinha, limpeza e organização',
      }),
    ).toBeInTheDocument();
  });

  it('links the real store social networks in a new tab', async () => {
    await renderAbout();
    const instagram = screen.getByRole('link', { name: 'Instagram' });
    expect(instagram).toHaveAttribute('href', 'https://www.instagram.com/multikoisas');
    expect(instagram).toHaveAttribute('target', '_blank');
    expect(instagram).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'Shopee' })).toHaveAttribute('href', 'https://shopee.com.br/multikoisas');
  });

  it('highlights whatsapp as the yellow contact button instead of a plain network link', async () => {
    server.use(http.get('*/socialnetwork', () => HttpResponse.json([instagramNetwork, whatsAppNetwork])));
    await renderAbout();
    const whatsApp = screen.getByRole('link', { name: 'Falar no WhatsApp' });
    expect(whatsApp).toHaveAttribute('href', 'https://wa.me/5500000000000');
    expect(whatsApp).toHaveAttribute('target', '_blank');
    expect(whatsApp).toHaveClass('bg-store-yellow');
    expect(screen.queryByRole('link', { name: 'WhatsApp' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Instagram' })).toBeInTheDocument();
  });

  it('keeps the text without links when the social networks cannot be read', async () => {
    server.use(http.get('*/socialnetwork', () => new HttpResponse(null, { status: 500 })));
    await renderAbout();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('shows the store identity in place of the photo while there is none, without a coming soon note', async () => {
    const { container } = await renderAbout();
    const brandTile = screen.getByRole('img', { name: 'MultiKoisas' });
    expect(brandTile).toHaveClass('bg-store-navy');
    expect(within(brandTile).getByText('Koisas')).toHaveClass('text-store-yellow');
    expect(container.textContent).not.toMatch(/em breve/i);
  });

  it('shows the saved store logo in place of the brand mark', async () => {
    const savedLogo = `${SUPABASE_IMAGES}/logo.png`;
    apiDatabase.storeImages.push({ id: 2, imagemUrl: savedLogo, tipo: 'LOGO' });
    await renderAbout();
    const brandTile = await screen.findByRole('img', { name: 'MultiKoisas' });
    await waitFor(() => expect(brandTile.querySelector('img')).toHaveAttribute('src', savedLogo));
    expect(brandTile.querySelector('img')).toHaveClass('object-contain');
    expect(within(brandTile).queryByText('Koisas')).not.toBeInTheDocument();
  });

  it('shows the saved store photo in place of the brand tile', async () => {
    const savedPhoto = `${SUPABASE_IMAGES}/fachada.jpg`;
    apiDatabase.storeImages.push({ id: 2, imagemUrl: savedPhoto, tipo: 'CAPA' });
    await renderAbout();
    expect(await screen.findByAltText('Foto da loja MultiKoisas')).toHaveAttribute('src', savedPhoto);
    expect(screen.queryByRole('img', { name: 'MultiKoisas' })).not.toBeInTheDocument();
  });

  it('shows the saved store description in place of the default one', async () => {
    await renderAbout();
    expect(await screen.findByText('Tudo em um só lugar')).toBeInTheDocument();
    expect(screen.queryByText(FALLBACK_DESCRIPTION)).not.toBeInTheDocument();
  });

  it('keeps the default description while the store has none', async () => {
    apiDatabase.stores = [];
    await renderAbout();
    await waitForApiAnswers();
    expect(screen.getByText(FALLBACK_DESCRIPTION)).toBeInTheDocument();
  });

  it('never invents a phone, address or company id', async () => {
    const { container } = await renderAbout();
    expect(container.textContent).not.toMatch(/R\$|\(11\)|\d{4}-\d{4}|CNPJ|NF-e|balcão|logística|rua |avenida/i);
  });
});
