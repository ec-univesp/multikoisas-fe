import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductDetail } from './ProductDetail';
import type { Product } from '@/entities/product';

const product: Product = {
  id: 1,
  slug: 'garrafa-termica-1l',
  name: 'Garrafa Térmica 1L',
  category: 'cozinha',
  categoryId: null,
  shortDescription: 'Mantém a temperatura por até 12 horas.',
  longDescription:
    'Garrafa térmica de 1 litro com ampola de vidro, ideal para café e chá. Alça para transporte e tampa que serve de xícara.',
  images: ['/products/garrafa-termica-1l.svg', '/products/garrafa-termica-1l-detalhe.svg'],
  storeLinks: [
    { store: 'mercado-livre', url: 'https://www.mercadolivre.com.br/' },
    { store: 'shopee', url: 'https://shopee.com.br/' },
  ],
};

describe('ProductDetail', () => {
  it('shows the product name as the main heading', () => {
    render(<ProductDetail product={product} />);
    expect(screen.getByRole('heading', { level: 1, name: product.name })).toBeInTheDocument();
  });

  it('shows the full description', () => {
    render(<ProductDetail product={product} />);
    expect(screen.getByText(product.longDescription)).toBeInTheDocument();
  });

  it('renders one buy link per store, naming the store and marking it as external', () => {
    render(<ProductDetail product={product} />);

    const mercadoLivreLink = screen.getByRole('link', { name: /comprar no mercado livre/i });
    expect(mercadoLivreLink).toHaveAttribute('href', 'https://www.mercadolivre.com.br/');
    expect(mercadoLivreLink).toHaveAttribute('target', '_blank');
    expect(mercadoLivreLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(mercadoLivreLink).toHaveAttribute('rel', expect.stringContaining('sponsored'));

    const shopeeLink = screen.getByRole('link', { name: /comprar na shopee/i });
    expect(shopeeLink).toHaveAttribute('href', 'https://shopee.com.br/');
    expect(shopeeLink).toHaveAttribute('target', '_blank');
    expect(shopeeLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(shopeeLink).toHaveAttribute('rel', expect.stringContaining('sponsored'));
  });

  it('links back to the storefront', () => {
    render(<ProductDetail product={product} />);
    expect(screen.getByRole('link', { name: /voltar para a vitrine/i })).toHaveAttribute('href', '/');
  });

  it('never shows a price', () => {
    render(<ProductDetail product={product} />);
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
  });

  it('opens on the first photo and lists every photo in order as a thumbnail', () => {
    render(<ProductDetail product={product} />);
    expect(screen.getByAltText('Garrafa Térmica 1L, foto 1 de 2')).toHaveAttribute(
      'src',
      expect.stringContaining('garrafa-termica-1l.svg'),
    );
    const thumbnails = screen.getAllByRole('button', { name: /^Ver foto/ });
    expect(thumbnails.map((thumbnail) => thumbnail.getAttribute('aria-label'))).toEqual([
      'Ver foto 1 de 2',
      'Ver foto 2 de 2',
    ]);
    expect(thumbnails[0]).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches the main photo to the chosen thumbnail', () => {
    const images = [...product.images, '/products/garrafa-termica-1l-tampa.svg'];
    render(<ProductDetail product={{ ...product, images }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver foto 3 de 3' }));

    expect(screen.getByAltText('Garrafa Térmica 1L, foto 3 de 3')).toHaveAttribute(
      'src',
      expect.stringContaining('garrafa-termica-1l-tampa.svg'),
    );
    expect(screen.queryByAltText('Garrafa Térmica 1L, foto 1 de 3')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver foto 3 de 3' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Ver foto 1 de 3' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows no thumbnails for a single photo', () => {
    render(<ProductDetail product={{ ...product, images: [product.images[0]] }} />);
    expect(screen.getByAltText('Garrafa Térmica 1L, foto 1 de 1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Ver foto/ })).not.toBeInTheDocument();
  });

  it('tells the visitor purchase links are coming when none exist', () => {
    render(<ProductDetail product={{ ...product, images: [], storeLinks: [] }} />);
    expect(screen.getByText('Links de compra em breve.')).toBeInTheDocument();
    expect(screen.getByAltText(product.name)).toHaveAttribute('src', expect.stringContaining('placeholder'));
  });
});
