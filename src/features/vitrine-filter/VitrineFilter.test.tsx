import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { VitrineFilter } from './VitrineFilter';
import type { Product } from '@/entities/product';

const buildProduct = (overrides: Partial<Product>): Product => ({
  slug: 'x',
  name: 'X',
  category: 'casa',
  shortDescription: 's',
  longDescription: 'l',
  images: ['/products/x.svg'],
  storeLinks: [{ store: 'shopee', url: 'https://shopee.com.br/' }],
  ...overrides,
});

const catalog = [
  buildProduct({ slug: 'garrafa', name: 'Garrafa Térmica', category: 'cozinha' }),
  buildProduct({ slug: 'balde', name: 'Balde 12L', category: 'limpeza' }),
  buildProduct({ slug: 'varal', name: 'Varal Sanfonado', category: 'casa' }),
];

describe('VitrineFilter', () => {
  it('renders an all chip plus one chip per category', () => {
    render(<VitrineFilter products={catalog} categories={['casa', 'cozinha', 'limpeza']} />);
    expect(screen.getByRole('button', { name: 'Todas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'casa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'cozinha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'limpeza' })).toBeInTheDocument();
  });

  it('starts with the all chip selected', () => {
    render(<VitrineFilter products={catalog} categories={['casa', 'cozinha', 'limpeza']} />);
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('filters the grid when a category chip is clicked', async () => {
    render(<VitrineFilter products={catalog} categories={['casa', 'cozinha', 'limpeza']} />);
    await userEvent.click(screen.getByRole('button', { name: 'limpeza' }));
    expect(screen.getByRole('button', { name: 'limpeza' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Balde 12L')).toBeInTheDocument();
    expect(screen.queryByText('Garrafa Térmica')).not.toBeInTheDocument();
  });

  it('filters the grid as the visitor types', async () => {
    render(<VitrineFilter products={catalog} categories={['casa', 'cozinha', 'limpeza']} />);
    await userEvent.type(screen.getByRole('searchbox', { name: /buscar produto/i }), 'termica');
    expect(screen.getByText('Garrafa Térmica')).toBeInTheDocument();
    expect(screen.queryByText('Balde 12L')).not.toBeInTheDocument();
  });

  it('offers to clear filters when nothing matches', async () => {
    render(<VitrineFilter products={catalog} categories={['casa', 'cozinha', 'limpeza']} />);
    await userEvent.type(screen.getByRole('searchbox', { name: /buscar produto/i }), 'inexistente');
    expect(screen.getByText(/nenhum produto encontrado/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /limpar filtros/i }));
    expect(screen.getByText('Garrafa Térmica')).toBeInTheDocument();
  });

  it('shows every product again when the all chip is clicked', async () => {
    render(<VitrineFilter products={catalog} categories={['casa', 'cozinha', 'limpeza']} />);
    await userEvent.click(screen.getByRole('button', { name: 'limpeza' }));
    expect(screen.queryByText('Garrafa Térmica')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Todas' }));
    expect(screen.getByText('Garrafa Térmica')).toBeInTheDocument();
    expect(screen.getByText('Balde 12L')).toBeInTheDocument();
  });

  it('clearing filters also resets the selected category', async () => {
    render(<VitrineFilter products={catalog} categories={['casa', 'cozinha', 'limpeza']} />);
    await userEvent.click(screen.getByRole('button', { name: 'limpeza' }));
    await userEvent.type(screen.getByRole('searchbox', { name: /buscar produto/i }), 'inexistente');
    await userEvent.click(screen.getByRole('button', { name: /limpar filtros/i }));
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Varal Sanfonado')).toBeInTheDocument();
  });
});
