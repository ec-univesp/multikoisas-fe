import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VitrineSearchProvider } from '@/features/vitrine-filter';
import { Vitrine } from './Vitrine';

const renderVitrine = async () => render(<VitrineSearchProvider>{await Vitrine()}</VitrineSearchProvider>);

describe('Vitrine', () => {
  it('anchors the product grid and lists the api products', async () => {
    const { container } = await renderVitrine();
    expect(container.querySelector('section#vitrine')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Vitrine de produtos' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('heading', { name: 'Garrafa Térmica 1L' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Balde 12L' })).toBeInTheDocument();
  });

  it('offers a chip per real product category', async () => {
    await renderVitrine();
    expect(screen.getByRole('button', { name: 'Todas as categorias' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Utensílios de Cozinha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sem categoria' })).toBeInTheDocument();
  });

  it('turns only real store links into buy buttons', async () => {
    await renderVitrine();
    expect(screen.getAllByRole('link', { name: /^Comprar na Shopee: / })).toHaveLength(2);
    expect(screen.queryByRole('link', { name: /instagram/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /^Opções de compra: / })).toHaveLength(3);
  });
});
