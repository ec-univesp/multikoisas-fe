import { describe, expect, it } from 'vitest';
import { getCategories, getProductBySlug, getProducts, parseProducts } from './accessor';

describe('parseProducts', () => {
  const validProduct = {
    slug: 'garrafa-termica-1l',
    name: 'Garrafa Térmica 1L',
    category: 'cozinha',
    shortDescription: 'curta',
    longDescription: 'longa',
    images: ['/products/garrafa-termica-1l.svg'],
    storeLinks: [{ store: 'mercado-livre', url: 'https://www.mercadolivre.com.br/' }],
  };

  it('aceita lista válida', () => {
    expect(parseProducts([validProduct])).toHaveLength(1);
  });

  it('rejeita produto sem storeLinks', () => {
    expect(() => parseProducts([{ ...validProduct, storeLinks: [] }])).toThrow(/garrafa-termica-1l/);
  });

  it('rejeita loja desconhecida', () => {
    expect(() =>
      parseProducts([{ ...validProduct, storeLinks: [{ store: 'amazon', url: 'https://x' }] }]),
    ).toThrow(/garrafa-termica-1l/);
  });

  it('rejeita slug duplicado', () => {
    expect(() => parseProducts([validProduct, validProduct])).toThrow(/duplicado/i);
  });

  it('rejeita produto sem imagem', () => {
    expect(() => parseProducts([{ ...validProduct, images: [] }])).toThrow(/garrafa-termica-1l/);
  });
});

describe('accessors sobre o JSON real', () => {
  it('getProducts retorna o catálogo validado', () => {
    expect(getProducts().length).toBeGreaterThanOrEqual(8);
  });

  it('getProductBySlug encontra produto existente', () => {
    const [firstProduct] = getProducts();
    expect(getProductBySlug(firstProduct.slug)).toEqual(firstProduct);
  });

  it('getProductBySlug retorna undefined para slug inexistente', () => {
    expect(getProductBySlug('nao-existe')).toBeUndefined();
  });

  it('getCategories deriva categorias únicas ordenadas', () => {
    const categories = getCategories();
    expect(categories).toEqual([...new Set(categories)].sort());
    expect(categories.length).toBeGreaterThanOrEqual(3);
  });
});
