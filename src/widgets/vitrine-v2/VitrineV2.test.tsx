import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VitrineV2 } from './VitrineV2';

describe('VitrineV2', () => {
  it('anchors the product grid and lists the api products', async () => {
    const { container } = render(await VitrineV2());
    expect(container.querySelector('section#vitrine')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Garrafa Térmica 1L' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Balde 12L' })).toBeInTheDocument();
  });

  it('turns only real store links into buy buttons', async () => {
    render(await VitrineV2());
    expect(screen.getAllByRole('link', { name: 'Comprar na Shopee' })).toHaveLength(2);
    expect(screen.queryByRole('link', { name: /instagram/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Opções de compra' })).toHaveLength(3);
  });

  it('never shows a price, phone or company id', async () => {
    const { container } = render(await VitrineV2());
    expect(container.textContent).not.toMatch(/R\$|\(11\)|CNPJ/);
  });
});
