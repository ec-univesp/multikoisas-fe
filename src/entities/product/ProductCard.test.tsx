import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProductCard } from './ProductCard';
import { STORE_PRESENTATION } from './types';
import type { Product } from './types';

const product: Product = {
  id: 1,
  slug: 'garrafa-termica-1l-1',
  name: 'Garrafa Térmica 1L',
  category: 'Utensílios de Cozinha',
  categoryId: 2,
  shortDescription: 'Mantém a temperatura.',
  longDescription: 'longa',
  images: ['/products/garrafa.webp'],
  storeLinks: [
    { store: 'shopee', url: 'https://shopee.com.br/garrafa' },
    { store: 'mercado-livre', url: 'https://www.mercadolivre.com.br/garrafa' },
  ],
};

describe('ProductCard', () => {
  it('shows the category, name, short description and photo', () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText('Utensílios de Cozinha')).toBeInTheDocument();
    const heading = screen.getByRole('heading', { name: 'Garrafa Térmica 1L' });
    expect(within(heading).getByRole('link', { name: 'Garrafa Térmica 1L' })).toHaveAttribute(
      'href',
      '/produto/garrafa-termica-1l-1',
    );
    expect(screen.getByText('Mantém a temperatura.')).toHaveClass('line-clamp-3');
    expect(screen.getByAltText('Garrafa Térmica 1L')).toHaveAttribute('src', expect.stringContaining('garrafa.webp'));
  });

  it('opens one sponsored new tab link per real store, side by side, in the store colors', () => {
    render(<ProductCard product={product} />);
    const shopee = screen.getByRole('link', { name: 'Comprar na Shopee: Garrafa Térmica 1L' });
    const mercadoLivre = screen.getByRole('link', { name: 'Comprar no Mercado Livre: Garrafa Térmica 1L' });
    expect(shopee).toHaveAttribute('href', 'https://shopee.com.br/garrafa');
    expect(shopee).toHaveAttribute('target', '_blank');
    expect(shopee).toHaveAttribute('rel', 'noopener noreferrer sponsored');
    expect(shopee).toHaveTextContent('Shopee');
    expect(shopee.className).toContain(STORE_PRESENTATION.shopee.purchaseButtonClassName);
    expect(mercadoLivre).toHaveAttribute('href', 'https://www.mercadolivre.com.br/garrafa');
    expect(shopee.parentElement?.className).toContain('sm:grid-cols-2');
  });

  it('keeps one button per store when two stores share the same link', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ProductCard
        product={{
          ...product,
          storeLinks: [
            { store: 'shopee', url: 'https://shopee.com.br/garrafa' },
            { store: 'magalu', url: 'https://shopee.com.br/garrafa' },
          ],
        }}
      />,
    );
    expect(screen.getByRole('link', { name: 'Comprar na Magalu: Garrafa Térmica 1L' })).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('spans a single store button across the card', () => {
    render(<ProductCard product={{ ...product, storeLinks: [product.storeLinks[0]] }} />);
    const shopee = screen.getByRole('link', { name: 'Comprar na Shopee: Garrafa Térmica 1L' });
    expect(shopee.parentElement?.className).not.toContain('sm:grid-cols-2');
  });

  it('shows no store button when the product has no store link', () => {
    render(<ProductCard product={{ ...product, storeLinks: [] }} />);
    expect(screen.queryByRole('link', { name: /comprar/i })).not.toBeInTheDocument();
  });

  it('leads to the product page from the purchase options button and the photo', () => {
    render(<ProductCard product={product} />);
    expect(screen.getByRole('link', { name: 'Opções de compra: Garrafa Térmica 1L' })).toHaveAttribute(
      'href',
      '/produto/garrafa-termica-1l-1',
    );
    expect(screen.getByAltText('Garrafa Térmica 1L').closest('a')).toHaveAttribute(
      'href',
      '/produto/garrafa-termica-1l-1',
    );
  });

  it('falls back to the placeholder photo', () => {
    render(<ProductCard product={{ ...product, images: [] }} />);
    expect(screen.getByAltText('Garrafa Térmica 1L')).toHaveAttribute('src', expect.stringContaining('placeholder'));
  });
});
