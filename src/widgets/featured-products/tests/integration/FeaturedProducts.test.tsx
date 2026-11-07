import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/msw/server';
import { waitForLoaded } from '@/test/waitForLoaded';
import { FeaturedProducts } from '../../FeaturedProducts';

const renderFeaturedProducts = async () => {
  const view = render(<FeaturedProducts />);
  await waitForLoaded();
  return view;
};

const carouselCards = () =>
  within(within(screen.getByRole('region', { name: 'Produtos em destaque' })).getByRole('list')).getAllByRole(
    'listitem',
  );

describe('FeaturedProducts', () => {
  it('holds the place of the carousel while the products load', () => {
    render(<FeaturedProducts />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando produtos em destaque...');
    expect(screen.getByRole('status').closest('section')).toHaveAttribute('aria-busy', 'true');
  });

  it('shows the five products of the store in the carousel', async () => {
    server.use(
      http.get('*/produto', () =>
        HttpResponse.json(
          Array.from({ length: 5 }, (_, index) => ({
            id: 200 + index,
            nome: `Produto ${index}`,
            descricaoProduto: '',
          })),
        ),
      ),
    );
    await renderFeaturedProducts();
    expect(carouselCards()).toHaveLength(5);
  });

  it('titles the section and shows the api products in the carousel', async () => {
    await renderFeaturedProducts();
    expect(screen.getByRole('heading', { level: 2, name: 'Produtos em destaque' })).toBeInTheDocument();
    expect(carouselCards()).toHaveLength(3);
    expect(screen.getByRole('heading', { level: 3, name: 'Garrafa Térmica 1L' })).toBeInTheDocument();
  });

  it('shows at most twelve products', async () => {
    server.use(
      http.get('*/produto', () =>
        HttpResponse.json(
          Array.from({ length: 15 }, (_, index) => ({
            id: 100 + index,
            nome: `Produto ${index}`,
            descricaoProduto: '',
          })),
        ),
      ),
    );
    await renderFeaturedProducts();
    expect(carouselCards()).toHaveLength(12);
  });

  it('leads to the full showcase page', async () => {
    await renderFeaturedProducts();
    expect(screen.getByRole('link', { name: 'Ver todos os produtos' })).toHaveAttribute('href', '/showcase');
  });

  it('leaves the section out when the catalog cannot be read', async () => {
    server.use(http.get('*/produto', () => new HttpResponse(null, { status: 500 })));
    const { container } = await renderFeaturedProducts();
    expect(container).toBeEmptyDOMElement();
  });
});
