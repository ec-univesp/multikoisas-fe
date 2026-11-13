import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Product } from '@/entities/product';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { ShowcaseFilter } from '../../ShowcaseFilter';
import { ShowcaseSearchProvider } from '../../ShowcaseSearch';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const product: Product = {
  id: 1,
  slug: 'balde-1',
  name: 'Balde 12L',
  categories: [{ id: 3, name: 'Banheiros' }],
  shortDescription: '',
  longDescription: '',
  images: [],
  storeLinks: [],
};

const renderGrid = () => {
  render(
    <ShowcaseSearchProvider>
      <ShowcaseFilter products={[product]} categories={['Banheiros']} />
    </ShowcaseSearchProvider>,
  );
  return screen.getByRole('list');
};

describe('ShowcaseFilter columns', () => {
  it('shows four columns on the computer while the store keeps the default', () => {
    expect(renderGrid()).toHaveClass('grid-cols-2', 'md:grid-cols-3', 'xl:grid-cols-4');
  });

  it('shows the three columns chosen in the panel on the computer and keeps two on the phone', async () => {
    apiDatabase.stores[0].colunaCarrossel = 3;
    const grid = renderGrid();
    await waitFor(() => expect(grid).toHaveClass('grid-cols-2', 'md:grid-cols-3', 'xl:grid-cols-3'));
    expect(grid).not.toHaveClass('xl:grid-cols-4');
  });

  it('never shows more columns on the tablet than the two chosen for the computer', async () => {
    apiDatabase.stores[0].colunaCarrossel = 2;
    const grid = renderGrid();
    await waitFor(() => expect(grid).toHaveClass('grid-cols-2', 'md:grid-cols-2', 'xl:grid-cols-2'));
    expect(grid).not.toHaveClass('md:grid-cols-3');
  });
});
