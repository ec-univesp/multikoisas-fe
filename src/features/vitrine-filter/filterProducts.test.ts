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
  it('sem filtros retorna tudo', () => {
    expect(filterProducts(catalog, { category: null, searchTerm: '' })).toHaveLength(4);
  });

  it('filtra por categoria', () => {
    expect(filterProducts(catalog, { category: 'limpeza', searchTerm: '' })).toEqual([catalog[1]]);
  });

  it('busca por nome sem diferenciar acento/caixa', () => {
    expect(filterProducts(catalog, { category: null, searchTerm: 'termica' })).toEqual([catalog[0]]);
  });

  it('combina categoria e busca', () => {
    expect(filterProducts(catalog, { category: 'casa', searchTerm: 'garrafa' })).toHaveLength(0);
  });

  it('encontra "Garrafa Térmica" buscando por "termica" sem acento', () => {
    expect(filterProducts(catalog, { category: null, searchTerm: 'termica' })).toEqual([catalog[0]]);
  });

  it('encontra "Caixa de Organização" buscando por "ORGANIZAÇÃO" com acento e caixa alta', () => {
    expect(filterProducts(catalog, { category: null, searchTerm: 'ORGANIZAÇÃO' })).toEqual([catalog[3]]);
  });
});
