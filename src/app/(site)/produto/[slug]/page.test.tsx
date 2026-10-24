import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProductPage from './page';

const renderProductPage = async (slug: string) =>
  render(await ProductPage({ params: Promise.resolve({ slug }) }));

describe('ProductPage', () => {
  it('shows every api photo of the product in id order', async () => {
    await renderProductPage('garrafa-termica-1l-1');
    const photos = screen.getAllByAltText(/^Garrafa Térmica 1L, foto \d de 3$/);
    expect(photos.map((photo) => photo.getAttribute('alt'))).toEqual([
      'Garrafa Térmica 1L, foto 1 de 3',
      'Garrafa Térmica 1L, foto 2 de 3',
      'Garrafa Térmica 1L, foto 3 de 3',
    ]);
    expect(photos[0]).toHaveAttribute('src', expect.stringContaining('garrafa-frente.webp'));
    expect(photos[1]).toHaveAttribute('src', expect.stringContaining('garrafa-tampa.jpeg'));
    expect(photos[2]).toHaveAttribute('src', expect.stringContaining('garrafa-lado.webp'));
  });

  it('shows the placeholder for a product without photos', async () => {
    await renderProductPage('balde-12l-5');
    expect(screen.getByAltText('Balde 12L')).toHaveAttribute('src', expect.stringContaining('placeholder'));
  });
});
