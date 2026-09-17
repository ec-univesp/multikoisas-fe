import { describe, expect, it } from 'vitest';
import { filterProducts } from './filterProducts';
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
  buildProduct({ slug: 'organizador', name: 'Caixa de Organização 30L', category: 'organizacao' }),
];

describe('filterProducts', () => {
  it('returns every product when no filter is set', () => {
    expect(filterProducts(catalog, { category: null, searchTerm: '' })).toHaveLength(4);
  });

  it('filters by category', () => {
    expect(filterProducts(catalog, { category: 'limpeza', searchTerm: '' })).toEqual([catalog[1]]);
  });

  it('searches by name ignoring accents and case', () => {
    expect(filterProducts(catalog, { category: null, searchTerm: 'termica' })).toEqual([catalog[0]]);
  });

  it('combines category and search', () => {
    expect(filterProducts(catalog, { category: 'casa', searchTerm: 'garrafa' })).toHaveLength(0);
  });

  it('finds an accented name when the search term has no accent', () => {
    expect(filterProducts(catalog, { category: null, searchTerm: 'termica' })).toEqual([catalog[0]]);
  });

  it('finds a product when the search term is accented and uppercase', () => {
    expect(filterProducts(catalog, { category: null, searchTerm: 'ORGANIZAÇÃO' })).toEqual([catalog[3]]);
  });
});
