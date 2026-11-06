import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProductPage, { metadata } from '../../page';

const renderProductPage = async (slug: string) => render(await ProductPage({ params: Promise.resolve({ slug }) }));

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
});
