import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductDetail } from './ProductDetail';
import type { Product } from '@/entities/product';

const product: Product = {
  slug: 'garrafa-termica-1l',
  name: 'Garrafa Térmica 1L',
  category: 'cozinha',
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
  it('mostra o nome do produto como heading principal', () => {
    render(<ProductDetail product={product} />);
    expect(screen.getByRole('heading', { level: 1, name: product.name })).toBeInTheDocument();
  });

  it('mostra a descrição longa', () => {
    render(<ProductDetail product={product} />);
    expect(screen.getByText(product.longDescription)).toBeInTheDocument();
  });

  it('mostra um link de compra por loja, nomeando cada loja com rel e target corretos', () => {
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

  it('mostra um link para voltar para a vitrine', () => {
    render(<ProductDetail product={product} />);
    expect(screen.getByRole('link', { name: /voltar para a vitrine/i })).toHaveAttribute('href', '/');
  });

  it('nunca mostra preço', () => {
    render(<ProductDetail product={product} />);
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
  });
});
