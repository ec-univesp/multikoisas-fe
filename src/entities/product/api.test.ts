import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/msw/server';
import { fetchCategories, fetchProductBySlug, fetchProducts } from './api';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchProducts', () => {
  it('maps api products into storefront products', async () => {
    const [garrafa] = await fetchProducts();
    expect(garrafa).toEqual({
      id: 1,
      slug: 'garrafa-termica-1l-1',
      name: 'Garrafa Térmica 1L',
      category: 'Utensílios de Cozinha',
      categoryId: 2,
      shortDescription: 'Mantém a temperatura.',
      longDescription: 'Mantém a temperatura.\r\n\r\nAmpola de vidro.',
      images: [],
      storeLinks: [],
    });
  });

  it('labels a product with no linked category', async () => {
    const [, balde] = await fetchProducts();
    expect(balde.category).toBe('Sem categoria');
    expect(balde.categoryId).toBeNull();
  });

  it('calls the api at the default address with a revalidation window', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await fetchProducts();
    expect(fetchSpy).toHaveBeenCalledWith('https://multikoisas-univesp.onrender.com/produto', {
      next: { revalidate: 300 },
    });
  });

  it('skips the cache when fresh data is requested', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await fetchProducts({ fresh: true });
    expect(fetchSpy).toHaveBeenCalledWith('https://multikoisas-univesp.onrender.com/produto', {
      cache: 'no-store',
    });
  });

  it('fails with the path and status when the api errors', async () => {
    server.use(http.get('*/produto', () => new HttpResponse(null, { status: 503 })));
    await expect(fetchProducts()).rejects.toThrow('/produto respondeu 503');
  });
});

describe('fetchProductBySlug', () => {
  it('finds the product by its slug', async () => {
    expect((await fetchProductBySlug('balde-12l-5'))?.name).toBe('Balde 12L');
  });

  it('returns undefined for an unknown slug', async () => {
    expect(await fetchProductBySlug('balde-12l-6')).toBeUndefined();
  });
});

describe('fetchCategories', () => {
  it('lists the api categories', async () => {
    expect(await fetchCategories({ fresh: true })).toEqual([
      { id: 2, name: 'Utensílios de Cozinha' },
      { id: 3, name: 'Banheiros' },
    ]);
  });
});
