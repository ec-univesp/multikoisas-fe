import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductCard } from './ProductCard';
import { STORE_PRESENTATION } from './types';
import type { Product } from './types';

const product: Product = {
  slug: 'garrafa-termica-1l',
  name: 'Garrafa Térmica 1L',
  category: 'cozinha',
  shortDescription: 'Mantém a temperatura por até 12 horas.',
  longDescription: 'longa',
  images: ['/products/garrafa-termica-1l.svg'],
  storeLinks: [
    { store: 'mercado-livre', url: 'https://www.mercadolivre.com.br/' },
    { store: 'shopee', url: 'https://shopee.com.br/' },
  ],
};

describe('ProductCard', () => {
  it('CTA nomeia a loja principal (primeiro storeLink)', () => {
    render(<ProductCard product={product} />);
    const buyLink = screen.getByRole('link', { name: /comprar no mercado livre/i });
    expect(buyLink).toHaveAttribute('href', 'https://www.mercadolivre.com.br/');
    expect(buyLink).toHaveAttribute('target', '_blank');
    expect(buyLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(buyLink).toHaveAttribute('rel', expect.stringContaining('sponsored'));
  });

  it('link de detalhe aponta para a rota do produto', () => {
    render(<ProductCard product={product} />);
    expect(screen.getByRole('link', { name: /ver detalhes/i })).toHaveAttribute(
      'href',
      '/produto/garrafa-termica-1l',
    );
  });

  it('a foto leva para a página do produto', () => {
    render(<ProductCard product={product} />);
    expect(screen.getByAltText('Garrafa Térmica 1L').closest('a')).toHaveAttribute(
      'href',
      '/produto/garrafa-termica-1l',
    );
  });

  it('o nome do produto leva para a página do produto', () => {
    render(<ProductCard product={product} />);
    expect(screen.getByRole('link', { name: 'Garrafa Térmica 1L' })).toHaveAttribute(
      'href',
      '/produto/garrafa-termica-1l',
    );
  });

  it('o botão de compra usa a cor da loja de destino', () => {
    const { rerender } = render(<ProductCard product={product} />);
    const mercadoLivreButton = screen.getByRole('link', { name: /mercado livre/i });
    expect(mercadoLivreButton.className).toContain(
      STORE_PRESENTATION['mercado-livre'].purchaseButtonClassName,
    );

    const shopeeFirstProduct: Product = {
      ...product,
      storeLinks: [{ store: 'shopee', url: 'https://shopee.com.br/' }],
    };
    rerender(<ProductCard product={shopeeFirstProduct} />);
    expect(screen.getByRole('link', { name: /shopee/i }).className).toContain(
      STORE_PRESENTATION.shopee.purchaseButtonClassName,
    );
  });

  it('mostra nome, categoria e descrição curta — e nenhum preço', () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText('Garrafa Térmica 1L')).toBeInTheDocument();
    expect(screen.getByText('cozinha')).toBeInTheDocument();
    expect(screen.getByText(/12 horas/)).toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
  });
});
