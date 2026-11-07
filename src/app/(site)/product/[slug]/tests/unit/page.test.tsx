import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/msw/server';
import ProductPage, { metadata } from '../../page';

const renderProductPage = async (slug: string) => render(await ProductPage({ params: Promise.resolve({ slug }) }));

afterEach(() => {
  vi.unstubAllGlobals();
  document.title = '';
});

describe('ProductPage', () => {
  it('names the page without depending on the product data', () => {
    expect(metadata.title).toBe('Detalhes do produto');
  });

  it('announces the product while it loads', async () => {
    await renderProductPage('balde-12l-5');
    expect(screen.getByRole('status')).toHaveTextContent('Carregando produto...');
    expect(screen.getByRole('status').closest('section')).toHaveAttribute('aria-busy', 'true');
  });

  it('shows every api photo of the product in id order', async () => {
    await renderProductPage('garrafa-termica-1l-1');
    expect(await screen.findByAltText('Garrafa Térmica 1L, foto 1 de 3')).toHaveAttribute(
      'src',
      expect.stringContaining('garrafa-frente.webp'),
    );
    const thumbnailSources = screen
      .getAllByRole('button', { name: /^Ver foto \d de 3$/ })
      .map((thumbnail) => thumbnail.querySelector('img')?.getAttribute('src'));
    expect(thumbnailSources).toEqual([
      expect.stringContaining('garrafa-frente.webp'),
      expect.stringContaining('garrafa-tampa.jpeg'),
      expect.stringContaining('garrafa-lado.webp'),
    ]);
  });

  it('shows the placeholder for a product without photos', async () => {
    await renderProductPage('balde-12l-5');
    expect(await screen.findByAltText('Balde 12L')).toHaveAttribute('src', expect.stringContaining('placeholder'));
  });

  it('opens a product created in this browser after the build', async () => {
    const created = await fetch('/api/produto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Rodo Novo', descricaoProduto: 'Puxa a água.' }),
    });
    const { id } = await created.json();
    await renderProductPage(`rodo-novo-${id}`);
    expect(await screen.findByRole('heading', { level: 1, name: 'Rodo Novo' })).toBeInTheDocument();
  });

  it('tells the visitor the product does not exist and leads back to the showcase', async () => {
    await renderProductPage('balde-12l-6');
    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para a vitrine' })).toHaveAttribute('href', '/showcase');
  });

  it('names the browser tab after the product it found', async () => {
    await renderProductPage('garrafa-termica-1l-1');
    await waitFor(() => expect(document.title).toBe('Garrafa Térmica 1L | MultiKoisas'));
  });

  it('offers to try again when the catalog cannot be loaded, instead of saying the product does not exist', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    server.use(http.get('*/produto', () => new HttpResponse(null, { status: 500 })));

    await renderProductPage('garrafa-termica-1l-1');

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar o produto.');
    expect(screen.queryByRole('heading', { name: 'Página não encontrada' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
