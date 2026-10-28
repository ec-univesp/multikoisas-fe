import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
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
});
