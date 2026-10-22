import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchProductBySlug, fetchProducts } from './api';

const apiResponses: Record<string, unknown> = {
  '/produto': [
    { id: 12, nome: 'Garrafa Térmica 1L', descricaoProduto: '\r\nMantém a temperatura.\r\n\r\nAmpola de vidro.' },
    { id: 30, nome: 'Balde', descricaoProduto: 'Resistente.' },
  ],
  '/categoria': [
    { id: 2, nome: 'Utensílios de Cozinha' },
    { id: 3, nome: 'Banheiros' },
  ],
  '/categoriaproduto': [
    { produtoId: 12, categoriaId: 2 },
    { produtoId: 12, categoriaId: 3 },
  ],
};

const stubApi = (status = 200) => {
  const fetchMock = vi.fn(async (url: string) => {
    const path = new URL(url).pathname;
    return new Response(JSON.stringify(apiResponses[path]), { status });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchProducts', () => {
  it('maps api products into storefront products', async () => {
    stubApi();
    const [garrafa] = await fetchProducts();
    expect(garrafa).toEqual({
      id: 12,
      slug: 'garrafa-termica-1l-12',
      name: 'Garrafa Térmica 1L',
      category: 'Utensílios de Cozinha',
      shortDescription: 'Mantém a temperatura.',
      longDescription: 'Mantém a temperatura.\r\n\r\nAmpola de vidro.',
      images: [],
      storeLinks: [],
    });
  });

  it('labels a product with no linked category', async () => {
    stubApi();
    const [, balde] = await fetchProducts();
    expect(balde.category).toBe('Sem categoria');
  });

  it('calls the api at the default address with a revalidation window', async () => {
    const fetchMock = stubApi();
    await fetchProducts();
    expect(fetchMock).toHaveBeenCalledWith('https://multikoisas-univesp.onrender.com/produto', {
      next: { revalidate: 300 },
    });
  });

  it('fails with the path and status when the api errors', async () => {
    stubApi(503);
    await expect(fetchProducts()).rejects.toThrow('/produto respondeu 503');
  });
});

describe('fetchProductBySlug', () => {
  it('finds the product by its slug', async () => {
    stubApi();
    expect((await fetchProductBySlug('balde-30'))?.name).toBe('Balde');
  });

  it('returns undefined for an unknown slug', async () => {
    stubApi();
    expect(await fetchProductBySlug('balde-31')).toBeUndefined();
  });
});
