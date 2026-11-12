import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/msw/server';
import { fetchCategories, fetchProductImageRecords, fetchProducts } from '../../api';

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
      categories: [{ id: 2, name: 'Utensílios de Cozinha' }],
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

  it.each([
    ['MAGAZINE LUIZA', 'magalu'],
    ['Magazine Luiza', 'magalu'],
    ['MERCADO LIVRE', 'mercado-livre'],
    ['MercadoLivre', 'mercado-livre'],
  ])('names the store from the full channel name %s', async (channelName, store) => {
    server.use(http.get('*/canalvenda', () => HttpResponse.json([{ id: 2, nome: channelName }])));
    const [garrafa] = await fetchProducts();
    expect(garrafa.storeLinks).toEqual([{ store, url: 'https://shopee.com.br/garrafa-termica' }]);
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

  it('gives a product every linked category in link order and none to a product without links', async () => {
    const [, balde, caixa] = await fetchProducts();
    expect(balde.categories).toEqual([]);
    expect(caixa.categories).toEqual([
      { id: 2, name: 'Utensílios de Cozinha' },
      { id: 3, name: 'Banheiros' },
    ]);
  });

  it('reads only through the local api in the browser, never the real api', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await fetchProducts();
    expect(fetchSpy).toHaveBeenCalledWith('/api/produto', { cache: 'no-store' });
    expect(fetchSpy).toHaveBeenCalledWith('/api/imagem', { cache: 'no-store' });
    expect(fetchSpy.mock.calls.some(([url]) => String(url).includes('onrender.com'))).toBe(false);
  });

  it('fails with the path and status when the api errors', async () => {
    server.use(http.get('*/produto', () => new HttpResponse(null, { status: 503 })));
    await expect(fetchProducts()).rejects.toThrow('/produto responded 503');
  });
});

describe('fetchCategories', () => {
  it('lists the api categories', async () => {
    expect(await fetchCategories()).toEqual([
      { id: 2, name: 'Utensílios de Cozinha' },
      { id: 3, name: 'Banheiros' },
    ]);
  });
});

describe('fetchProductImageRecords', () => {
  it('lists the photos of a product with their ids in id order, ready to display', async () => {
    expect(await fetchProductImageRecords(7)).toEqual([
      { id: 20, url: `${SUPABASE_IMAGES}/caixa.webp` },
      {
        id: 21,
        url: 'https://avphmmvnlrbidhjrzozx.storage.supabase.co/storage/v1/object/public/imagem/caixa-tampa.jpeg',
      },
      { id: 22, url: null },
    ]);
  });

  it('answers no photos when the api says the product has none', async () => {
    expect(await fetchProductImageRecords(5)).toEqual([]);
  });
});

describe('empty lists from the api', () => {
  it('keeps every product when the api answers the purchase links with 204 and the categories with 404', async () => {
    server.use(
      http.get('*/canalvendaproduto', () => new HttpResponse(null, { status: 204 })),
      http.get('*/categoriaproduto', () => new HttpResponse(null, { status: 404 })),
    );
    const products = await fetchProducts();
    expect(products).toHaveLength(3);
    expect(products.every((product) => product.storeLinks.length === 0 && product.categories.length === 0)).toBe(true);
  });
});
