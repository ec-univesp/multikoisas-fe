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

  it('rejeita quando o conteúdo não é uma lista', () => {
    expect(() => parseProducts({ slug: 'x' })).toThrow(/lista/i);
  });

  it.each([
    ['slug', 'slug ausente'],
    ['name', 'name ausente'],
    ['category', 'category ausente'],
    ['shortDescription', 'shortDescription ausente'],
    ['longDescription', 'longDescription ausente'],
  ])('rejeita produto sem %s', (missingField, expectedReason) => {
    expect(() => parseProducts([{ ...validProduct, [missingField]: '   ' }])).toThrow(
      expectedReason,
    );
  });

  it('identifica pela posição o produto cujo slug está ausente', () => {
    expect(() => parseProducts([{ ...validProduct, slug: undefined }])).toThrow(/posição 0/);
  });

  it('rejeita produto nulo', () => {
    expect(() => parseProducts([null])).toThrow(/posição 0/);
  });

  it('rejeita images que não é lista', () => {
    expect(() => parseProducts([{ ...validProduct, images: '/products/x.svg' }])).toThrow(/images/);
  });

  it('rejeita caminho de imagem vazio', () => {
    expect(() => parseProducts([{ ...validProduct, images: [''] }])).toThrow(/images/);
  });

  it('rejeita storeLinks que não é lista', () => {
    expect(() => parseProducts([{ ...validProduct, storeLinks: 'shopee' }])).toThrow(/storeLinks/);
  });

  it('rejeita link de loja sem url', () => {
    expect(() =>
      parseProducts([{ ...validProduct, storeLinks: [{ store: 'shopee', url: '' }] }]),
    ).toThrow(/storeLinks/);
  });

  it('rejeita link de loja que não é objeto', () => {
    expect(() =>
      parseProducts([{ ...validProduct, storeLinks: ['https://shopee.com.br/'] }]),
    ).toThrow(/storeLinks/);
  });

  it('rejeita link de loja nulo', () => {
    expect(() => parseProducts([{ ...validProduct, storeLinks: [null] }])).toThrow(/storeLinks/);
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
