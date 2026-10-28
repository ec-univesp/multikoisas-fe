import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@/entities/product';
import { apiDatabase, SUPABASE_IMAGES } from '@/test/msw/apiDatabase';
import { recordApiRequests, server } from '@/test/msw/server';
import { syncProductImages } from './productApi';

const garrafa: Product = {
  id: 1,
  slug: 'garrafa-termica-1l-1',
  name: 'Garrafa Térmica 1L',
  category: 'Utensílios de Cozinha',
  categoryId: 2,
  shortDescription: 'Mantém a temperatura.',
  longDescription: 'Mantém a temperatura.',
  images: [`${SUPABASE_IMAGES}/antiga.webp`],
  storeLinks: [],
};

const garrafaPhotos = [
  { id: 10, url: `${SUPABASE_IMAGES}/garrafa-frente.webp` },
  { id: 11, url: null },
  { id: 12, url: `${SUPABASE_IMAGES}/garrafa-lado.webp` },
];

const photo = (name: string) => new File(['png'], name, { type: 'image/png' });

let apiRequests: string[] = [];

beforeEach(() => {
  apiRequests = recordApiRequests();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('syncProductImages', () => {
  it('removes the marked photos, uploads the new ones in order and returns the resulting images', async () => {
    const contentTypes: (string | null)[] = [];
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST') contentTypes.push(request.headers.get('content-type'));
    });

    const result = await syncProductImages(garrafa, garrafaPhotos, {
      removedPhotoIds: [10],
      newFiles: [photo('a.png'), photo('b.png')],
    });

    expect(result).toEqual({
      product: {
        ...garrafa,
        images: [`${SUPABASE_IMAGES}/garrafa-lado.webp`, `${SUPABASE_IMAGES}/upload-100`, `${SUPABASE_IMAGES}/upload-101`],
      },
      failedPhotoCount: 0,
    });
    expect(apiRequests).toEqual(['DELETE /api/imagem', 'POST /api/imagem', 'POST /api/imagem']);
    expect(contentTypes).toEqual([
      expect.stringMatching(/^multipart\/form-data; boundary=/),
      expect.stringMatching(/^multipart\/form-data; boundary=/),
    ]);
    expect(apiDatabase.imagens.filter((image) => image.produtoId === 1).map((image) => image.id)).toEqual([
      12, 11, 100, 101,
    ]);
  });

  it('counts the photos that failed and keeps a photo whose removal failed', async () => {
    server.use(
      http.delete('*/imagem', () => new HttpResponse(null, { status: 500 })),
      http.post('*/imagem', () => new HttpResponse(null, { status: 500 }), { once: true }),
    );

    const result = await syncProductImages(garrafa, garrafaPhotos, {
      removedPhotoIds: [12],
      newFiles: [photo('a.png'), photo('b.png')],
    });

    expect(result).toEqual({
      product: {
        ...garrafa,
        images: [
          `${SUPABASE_IMAGES}/garrafa-frente.webp`,
          `${SUPABASE_IMAGES}/garrafa-lado.webp`,
          `${SUPABASE_IMAGES}/upload-100`,
        ],
      },
      failedPhotoCount: 2,
    });
  });

  it('adds the uploads to the known images when the current photos could not be loaded', async () => {
    const result = await syncProductImages(garrafa, null, { removedPhotoIds: [], newFiles: [photo('a.png')] });

    expect(result.product.images).toEqual([`${SUPABASE_IMAGES}/antiga.webp`, `${SUPABASE_IMAGES}/upload-100`]);
  });

  it('calls nothing when no photo changed', async () => {
    const result = await syncProductImages(garrafa, garrafaPhotos, { removedPhotoIds: [], newFiles: [] });

    expect(result.product.images).toEqual([
      `${SUPABASE_IMAGES}/garrafa-frente.webp`,
      `${SUPABASE_IMAGES}/garrafa-lado.webp`,
    ]);
    expect(apiRequests).toEqual([]);
  });

  it('sends each chosen file with the product id in its own upload form', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const fileA = photo('a.png');
    const fileB = photo('b.png');

    await syncProductImages(garrafa, garrafaPhotos, { removedPhotoIds: [], newFiles: [fileA, fileB] });

    const uploadForms = fetchSpy.mock.calls
      .map(([, init]) => init?.body)
      .filter((body): body is FormData => body instanceof FormData);
    expect(uploadForms).toHaveLength(2);
    expect(uploadForms[0].get('file')).toBe(fileA);
    expect(uploadForms[1].get('file')).toBe(fileB);
    expect(uploadForms.map((form) => form.get('produtoId'))).toEqual(['1', '1']);
  });

  it('counts as removed a photo the api no longer has', async () => {
    server.use(http.delete('*/imagem', () => new HttpResponse(null, { status: 404 })));

    const result = await syncProductImages(garrafa, garrafaPhotos, { removedPhotoIds: [10], newFiles: [] });

    expect(result).toEqual({
      product: { ...garrafa, images: [`${SUPABASE_IMAGES}/garrafa-lado.webp`] },
      failedPhotoCount: 0,
    });
  });

  it('does not count an upload whose answer cannot be read and reloads the photos of the product', async () => {
    server.use(
      http.post(
        '*/imagem',
        () => {
          apiDatabase.imagens.push({ id: 90, produtoId: 1, imagemUrl: `${SUPABASE_IMAGES}/sem-resposta.png` });
          return new HttpResponse('', { status: 201 });
        },
        { once: true },
      ),
    );

    const result = await syncProductImages(garrafa, garrafaPhotos, {
      removedPhotoIds: [],
      newFiles: [photo('a.png'), photo('b.png')],
    });

    expect(result).toEqual({
      product: {
        ...garrafa,
        images: [
          `${SUPABASE_IMAGES}/garrafa-frente.webp`,
          'https://avphmmvnlrbidhjrzozx.storage.supabase.co/storage/v1/object/public/imagem/garrafa-tampa.jpeg',
          `${SUPABASE_IMAGES}/garrafa-lado.webp`,
          `${SUPABASE_IMAGES}/sem-resposta.png`,
          `${SUPABASE_IMAGES}/upload-100`,
        ],
      },
      failedPhotoCount: 0,
    });
    expect(apiRequests).toEqual(['POST /api/imagem', 'POST /api/imagem', 'GET /api/imagem/1']);
  });

  it('keeps the known photos when the reload after an unreadable upload fails', async () => {
    server.use(
      http.post('*/imagem', () => new HttpResponse('', { status: 201 }), { once: true }),
      http.get('*/imagem/:produtoId', () => new HttpResponse(null, { status: 500 })),
    );

    const result = await syncProductImages(garrafa, garrafaPhotos, {
      removedPhotoIds: [],
      newFiles: [photo('a.png'), photo('b.png')],
    });

    expect(result).toEqual({
      product: {
        ...garrafa,
        images: [
          `${SUPABASE_IMAGES}/garrafa-frente.webp`,
          `${SUPABASE_IMAGES}/garrafa-lado.webp`,
          `${SUPABASE_IMAGES}/upload-100`,
        ],
      },
      failedPhotoCount: 0,
    });
  });
});
