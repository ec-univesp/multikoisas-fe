import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProductPage from './page';

const renderProductPage = async (slug: string) =>
  render(await ProductPage({ params: Promise.resolve({ slug }) }));

describe('ProductPage', () => {
  it('shows every api photo of the product in id order', async () => {
    await renderProductPage('garrafa-termica-1l-1');
    expect(screen.getByAltText('Garrafa Térmica 1L, foto 1 de 3')).toHaveAttribute(
      'src',
      expect.stringContaining('garrafa-frente.webp'),
    );
    const thumbnailSources = screen
      .getAllByRole('button', { name: /^Ver foto \d de 3$/ })
      .map((thumbnail) => thumbnail.querySelector('img')?.getAttribute('src'));
    expect(thumbnailSources).toEqual([
      expect.stringContaining('garrafa-frente.webp'),
      expect.stringContaining('garrafa-tampa.jpeg'),
      expect.stringContaining('garrafa-lado.webp'),
    ]);
  });

  it('shows the placeholder for a product without photos', async () => {
    await renderProductPage('balde-12l-5');
    expect(screen.getByAltText('Balde 12L')).toHaveAttribute('src', expect.stringContaining('placeholder'));
  });
});
