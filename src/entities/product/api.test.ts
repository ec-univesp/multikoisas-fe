import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/msw/server';
import { fetchCategories, fetchProductBySlug, fetchProductImageRecords, fetchProducts } from './api';

const SUPABASE_IMAGES = 'https://avphmmvnlrbidhjrzozx.supabase.co/storage/v1/object/public/imagem';

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
      images: [
        `${SUPABASE_IMAGES}/garrafa-frente.webp`,
        'https://avphmmvnlrbidhjrzozx.storage.supabase.co/storage/v1/object/public/imagem/garrafa-tampa.jpeg',
        `${SUPABASE_IMAGES}/garrafa-lado.webp`,
      ],
      storeLinks: [{ store: 'shopee', url: 'https://shopee.com.br/garrafa-termica' }],
    });
  });

  it('gives each product only its own store links and none to a product without links', async () => {
    const [, balde, caixa] = await fetchProducts();
    expect(balde.storeLinks).toEqual([]);
    expect(caixa.storeLinks).toEqual([{ store: 'shopee', url: 'https://shopee.com.br/caixa' }]);
  });

  it('names the store from the sales channel, whatever its spelling in the api', async () => {
    server.use(http.get('*/canalvenda', () => HttpResponse.json([{ id: 2, nome: 'MagaLu' }])));
    const [garrafa] = await fetchProducts();
    expect(garrafa.storeLinks).toEqual([{ store: 'magalu', url: 'https://shopee.com.br/garrafa-termica' }]);
  });

  it('keeps only the first link of a store listed twice for the same product', async () => {
    server.use(
      http.get('*/canalvendaproduto', () =>
        HttpResponse.json([
          { produtoId: 1, canalVendaId: 2, link: 'https://shopee.com.br/garrafa-termica' },
          { produtoId: 1, canalVendaId: 2, link: 'https://shopee.com.br/garrafa-repetida' },
        ]),
      ),
    );
    const [garrafa] = await fetchProducts();
    expect(garrafa.storeLinks).toEqual([{ store: 'shopee', url: 'https://shopee.com.br/garrafa-termica' }]);
  });

  it('keeps the storefront up without store links when the links fail', async () => {
    server.use(http.get('*/canalvendaproduto', () => new HttpResponse(null, { status: 500 })));
    const products = await fetchProducts();
    expect(products).toHaveLength(3);
    expect(products.every((product) => product.storeLinks.length === 0)).toBe(true);
  });

  it('gives each product only its own images and none to a product without images', async () => {
    const [, balde, caixa] = await fetchProducts();
    expect(balde.images).toEqual([]);
    expect(caixa.images).toEqual([
      `${SUPABASE_IMAGES}/caixa.webp`,
      'https://avphmmvnlrbidhjrzozx.storage.supabase.co/storage/v1/object/public/imagem/caixa-tampa.jpeg',
    ]);
  });

  it('keeps the storefront up without images when the image list fails', async () => {
    server.use(http.get('*/imagem', () => new HttpResponse(null, { status: 500 })));
    const products = await fetchProducts();
    expect(products).toHaveLength(3);
    expect(products.every((product) => product.images.length === 0)).toBe(true);
  });

  it('goes through the site proxy when called from the browser', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await fetchProducts({ fresh: true, fromBrowser: true });
    expect(fetchSpy).toHaveBeenCalledWith('/api/produto', { cache: 'no-store' });
    expect(fetchSpy).toHaveBeenCalledWith('/api/imagem', { cache: 'no-store' });
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
    expect(fetchSpy).toHaveBeenCalledWith('https://multikoisas-univesp.onrender.com/imagem', {
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

describe('fetchProductImageRecords', () => {
  it('lists the photos of a product with their ids in id order, ready to display', async () => {
    expect(await fetchProductImageRecords(7, { fresh: true, fromBrowser: true })).toEqual([
      { id: 20, url: `${SUPABASE_IMAGES}/caixa.webp` },
      { id: 21, url: 'https://avphmmvnlrbidhjrzozx.storage.supabase.co/storage/v1/object/public/imagem/caixa-tampa.jpeg' },
      { id: 22, url: null },
    ]);
  });
});
