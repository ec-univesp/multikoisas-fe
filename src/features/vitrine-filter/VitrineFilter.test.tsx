import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Product } from '@/entities/product';
import { VitrineFilter } from './VitrineFilter';
import { VitrineSearchField, VitrineSearchProvider } from './VitrineSearch';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const buildProduct = (overrides: Partial<Product>): Product => ({
  id: 1,
  slug: 'produto-1',
  name: 'Produto',
  category: 'Banheiros',
  categoryId: 3,
  shortDescription: '',
  longDescription: '',
  images: [],
  storeLinks: [],
  ...overrides,
});

const products = [
  buildProduct({ id: 1, slug: 'garrafa-1', name: 'Garrafa Térmica', category: 'Utensílios de Cozinha' }),
  buildProduct({ id: 2, slug: 'balde-2', name: 'Balde 12L', category: 'Banheiros' }),
  buildProduct({ id: 3, slug: 'panela-3', name: 'Panela', category: 'Utensílios de Cozinha' }),
];
const categories = ['Banheiros', 'Utensílios de Cozinha'];

const renderFilter = () =>
  render(
    <VitrineSearchProvider>
      <header>
        <VitrineSearchField id="header-search" label="Buscar produto no cabeçalho" />
      </header>
      <VitrineFilter products={products} categories={categories} />
    </VitrineSearchProvider>,
  );

const productNames = () => screen.queryAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);

describe('VitrineFilter', () => {
  it('lists every product with the all categories chip pressed and the item count', () => {
    renderFilter();
    expect(screen.getByRole('button', { name: 'Todas as categorias' })).toHaveAttribute('aria-pressed', 'true');
    expect(productNames()).toEqual(['Garrafa Térmica', 'Balde 12L', 'Panela']);
    expect(screen.getByText('3 itens exibidos')).toBeInTheDocument();
    expect(screen.getByRole('search', { name: 'Buscar produto na vitrine' })).toBeInTheDocument();
  });

  it('keeps the chips inside their own horizontal scroll strip', () => {
    renderFilter();
    const chipStrip = screen.getByRole('group', { name: 'Categorias' });
    expect(chipStrip).toHaveClass('overflow-x-auto');
    expect(within(chipStrip).getAllByRole('button')).toHaveLength(3);
  });

  it('narrows the grid to the pressed category chip', async () => {
    renderFilter();
    await userEvent.click(screen.getByRole('button', { name: 'Banheiros' }));
    expect(screen.getByRole('button', { name: 'Banheiros' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Todas as categorias' })).toHaveAttribute('aria-pressed', 'false');
    expect(productNames()).toEqual(['Balde 12L']);
    expect(screen.getByText('1 item exibido')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Todas as categorias' }));
    expect(productNames()).toHaveLength(3);
  });

  it('filters by the search typed in the showcase or in the header', async () => {
    renderFilter();
    const headerSearch = screen.getByRole('searchbox', { name: 'Buscar produto no cabeçalho' });
    const showcaseSearch = screen.getByRole('searchbox', { name: 'Buscar produto na vitrine' });
    await userEvent.type(showcaseSearch, 'panela');
    expect(productNames()).toEqual(['Panela']);
    await userEvent.clear(headerSearch);
    await userEvent.type(headerSearch, 'termica');
    expect(productNames()).toEqual(['Garrafa Térmica']);
    expect(showcaseSearch).toHaveValue('termica');
  });

  it('offers to clear the filters when nothing matches', async () => {
    renderFilter();
    await userEvent.click(screen.getByRole('button', { name: 'Banheiros' }));
    await userEvent.type(screen.getAllByRole('searchbox')[1], 'panela');
    expect(screen.getByText('Nenhum produto encontrado.')).toBeInTheDocument();
    expect(screen.getByText('0 itens exibidos')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(productNames()).toHaveLength(3);
    expect(screen.getAllByRole('searchbox')[0]).toHaveValue('');
  });

  it('does not offer to clear filters when the catalog is empty', () => {
    render(
      <VitrineSearchProvider>
        <VitrineFilter products={[]} categories={[]} />
      </VitrineSearchProvider>,
    );
    expect(screen.getByText('Nenhum produto encontrado.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument();
  });

  it('keeps the category and the search when the showcase comes back under the same provider', async () => {
    const { rerender } = renderFilter();
    await userEvent.click(screen.getByRole('button', { name: 'Utensílios de Cozinha' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar produto na vitrine' }), 'panela');
    rerender(<VitrineSearchProvider />);
    rerender(
      <VitrineSearchProvider>
        <VitrineFilter products={products} categories={categories} />
      </VitrineSearchProvider>,
    );
    expect(screen.getByRole('button', { name: 'Utensílios de Cozinha' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('searchbox', { name: 'Buscar produto na vitrine' })).toHaveValue('panela');
    expect(productNames()).toEqual(['Panela']);
  });
});
