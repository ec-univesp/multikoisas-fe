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

  it('accepts a valid list', () => {
    expect(parseProducts([validProduct])).toHaveLength(1);
  });

  it('rejects a product with no store link', () => {
    expect(() => parseProducts([{ ...validProduct, storeLinks: [] }])).toThrow(/garrafa-termica-1l/);
  });

  it('rejects an unknown store', () => {
    expect(() =>
      parseProducts([{ ...validProduct, storeLinks: [{ store: 'amazon', url: 'https://x' }] }]),
    ).toThrow(/garrafa-termica-1l/);
  });

  it('rejects a duplicated slug', () => {
    expect(() => parseProducts([validProduct, validProduct])).toThrow(/duplicado/i);
  });

  it('rejects a product with no image', () => {
    expect(() => parseProducts([{ ...validProduct, images: [] }])).toThrow(/garrafa-termica-1l/);
  });

  it('rejects content that is not a list', () => {
    expect(() => parseProducts({ slug: 'x' })).toThrow(/lista/i);
  });

  it.each([
    ['slug', 'slug ausente'],
    ['name', 'name ausente'],
    ['category', 'category ausente'],
    ['shortDescription', 'shortDescription ausente'],
    ['longDescription', 'longDescription ausente'],
  ])('rejects a product missing %s', (missingField, expectedReason) => {
    expect(() => parseProducts([{ ...validProduct, [missingField]: '   ' }])).toThrow(
      expectedReason,
    );
  });

  it('identifies a product missing its slug by position', () => {
    expect(() => parseProducts([{ ...validProduct, slug: undefined }])).toThrow(/posição 0/);
  });

  it('rejects a null product', () => {
    expect(() => parseProducts([null])).toThrow(/posição 0/);
  });

  it('rejects images that is not a list', () => {
    expect(() => parseProducts([{ ...validProduct, images: '/products/x.svg' }])).toThrow(/images/);
  });

  it('rejects an empty image path', () => {
    expect(() => parseProducts([{ ...validProduct, images: [''] }])).toThrow(/images/);
  });

  it('rejects storeLinks that is not a list', () => {
    expect(() => parseProducts([{ ...validProduct, storeLinks: 'shopee' }])).toThrow(/storeLinks/);
  });

  it('rejects a store link with no url', () => {
    expect(() =>
      parseProducts([{ ...validProduct, storeLinks: [{ store: 'shopee', url: '' }] }]),
    ).toThrow(/storeLinks/);
  });

  it('rejects a store link that is not an object', () => {
    expect(() =>
      parseProducts([{ ...validProduct, storeLinks: ['https://shopee.com.br/'] }]),
    ).toThrow(/storeLinks/);
  });

  it('rejects a null store link', () => {
    expect(() => parseProducts([{ ...validProduct, storeLinks: [null] }])).toThrow(/storeLinks/);
  });
});

describe('catalog accessors', () => {
  it('returns the validated catalog', () => {
    expect(getProducts().length).toBeGreaterThanOrEqual(8);
  });

  it('finds an existing product by slug', () => {
    const [firstProduct] = getProducts();
    expect(getProductBySlug(firstProduct.slug)).toEqual(firstProduct);
  });

  it('returns undefined for an unknown slug', () => {
    expect(getProductBySlug('nao-existe')).toBeUndefined();
  });

  it('derives unique sorted categories', () => {
    const categories = getCategories();
    expect(categories).toEqual([...new Set(categories)].sort());
    expect(categories.length).toBeGreaterThanOrEqual(3);
  });
});
