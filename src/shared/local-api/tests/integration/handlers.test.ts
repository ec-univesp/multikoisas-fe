import { getResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/msw/server';
import { createDatabase, type ApiDatabase } from '../../database';
import { createApiHandlers, createLocalImagesHandler } from '../../handlers';
import { createMemoryImageStore, type ImageStore } from '../../imageStore';

const send = (method: string, path: string, body?: unknown) =>
  fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

// Vitest jsdom replaces the content of every File in FormData: the multipart body is written by hand.
const uploadPhoto = (produtoId: number, content: string) =>
  fetch(`/api/imagem?produtoId=${produtoId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data; boundary=limite' },
    body: [
      '--limite',
      'Content-Disposition: form-data; name="file"; filename="foto.png"',
      'Content-Type: image/png',
      '',
      content,
      '--limite--',
      '',
    ].join('\r\n'),
  });

let database: ApiDatabase;
let images: ImageStore;
const onChange = vi.fn();

beforeEach(() => {
  database = createDatabase({
    products: [{ id: 1, nome: 'Balde', descricaoProduto: 'Resistente.' }],
    categories: [{ id: 2, nome: 'Casa' }],
    productCategories: [{ produtoId: 1, categoriaId: 2 }],
    productImages: [],
    socialNetworks: [{ id: 3, descricao: 'Instagram', link: 'https://instagram.com/multikoisas' }],
    salesChannels: [{ id: 4, nome: 'Shopee' }],
    purchaseLinks: [{ produtoId: 1, canalVendaId: 4, link: 'https://shopee.com.br/balde' }],
  });
  images = createMemoryImageStore();
  onChange.mockReset();
  server.use(
    ...createApiHandlers(database, {
      baseUrl: '/api',
      onChange,
      images,
      imageUrl: (id) => `http://localhost/local-images/${id}`,
      reproduceApiBugs: true,
    }),
    createLocalImagesHandler(images),
  );
});

describe('local api handlers', () => {
  it('reads and writes the database it was given', async () => {
    const created = await send('POST', '/api/categoria', { nome: 'Jardim' });
    expect(created.status).toBe(201);
    expect(database.categories).toContainEqual({ id: 5, nome: 'Jardim' });
    expect(await (await send('GET', '/api/categoria?nome=jardim')).json()).toEqual([{ id: 5, nome: 'Jardim' }]);
  });

  it('reports every successful write', async () => {
    await send('POST', '/api/produto', { nome: 'Caixa' });
    await send('PUT', '/api/produto/1', { nome: 'Balde 12L' });
    await send('PUT', '/api/categoria/2', { nome: 'Lar' });
    await send('POST', '/api/canalvenda', { nome: 'MagaLu' });
    await send('PUT', '/api/canalvenda/4', { nome: 'Shopee BR' });
    await send('POST', '/api/categoriaproduto', { produtoId: 5, categoriaId: 2 });
    await send('DELETE', '/api/categoriaproduto', { produtoId: 5, categoriaId: 2 });
    await send('POST', '/api/canalvendaproduto', { produtoId: 5, canalVendaId: 4, link: 'https://x.com/a' });
    await send('DELETE', '/api/canalvendaproduto', { produtoId: 5, canalVendaId: 4, link: 'https://x.com/a' });
    await send('PUT', '/api/socialnetwork/Instagram', { link: 'https://instagram.com/novo' });
    await send('DELETE', '/api/socialnetwork/Instagram');
    await send('DELETE', '/api/canalvenda/6');
    await send('DELETE', '/api/produto/1');
    await send('DELETE', '/api/categoria/2');
    expect(onChange).toHaveBeenCalledTimes(14);
  });

  it('does not report reads nor writes the api refuses', async () => {
    await send('GET', '/api/produto');
    expect((await send('POST', '/api/categoria', { nome: 'Casa' })).status).toBe(409);
    expect((await send('POST', '/api/produto', { nome: ' ' })).status).toBe(400);
    expect((await send('DELETE', '/api/categoria/2')).status).toBe(409);
    expect((await send('POST', '/api/socialnetwork', { descricao: 'TikTok', link: 'https://t.co' })).status).toBe(409);
    expect((await uploadPhoto(1, '')).status).toBe(409);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps an uploaded photo in the image store and serves it back', async () => {
    const uploaded = await uploadPhoto(1, 'png-bytes');
    expect(uploaded.status).toBe(201);
    expect(await uploaded.json()).toEqual({ id: 5, produtoId: 1, imagemUrl: 'http://localhost/local-images/5' });
    expect(onChange).toHaveBeenCalledTimes(1);

    const served = await fetch('/local-images/5');
    expect(served.headers.get('content-type')).toBe('image/png');
    expect(await served.text()).toBe('png-bytes');
  });

  it('answers 404 for a photo that is not stored', async () => {
    expect((await fetch('/local-images/99')).status).toBe(404);
  });

  it('removes the stored file when the photo is deleted', async () => {
    await uploadPhoto(1, 'png-bytes');
    const deleted = await send('DELETE', '/api/imagem', { id: 5, produtoId: 1 });
    expect(deleted.status).toBe(204);
    expect(await images.get(5)).toBeUndefined();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('removes the stored files of a deleted product', async () => {
    await uploadPhoto(1, 'frente');
    await uploadPhoto(1, 'lado');
    expect((await send('DELETE', '/api/produto/1')).status).toBe(200);
    expect(await images.get(5)).toBeUndefined();
    expect(await images.get(6)).toBeUndefined();
  });

  it('leaves page routes alone when mounted under /api', async () => {
    const handlers = createApiHandlers(database, {
      baseUrl: '/api',
      onChange,
      images,
      imageUrl: String,
      reproduceApiBugs: true,
    });
    const answerTo = (path: string) => getResponse(handlers, new Request(new URL(path, location.origin)));
    expect(await answerTo('/api/produto?id=1')).toBeDefined();
    for (const pagePath of ['/produto?id=1', '/produto/balde', '/categoria', '/admin/products']) {
      expect(await answerTo(pagePath)).toBeUndefined();
    }
  });
});

describe('local api handlers without the api bugs', () => {
  beforeEach(() => {
    server.use(
      ...createApiHandlers(database, {
        baseUrl: '/api',
        onChange,
        images,
        imageUrl: (id) => `http://localhost/local-images/${id}`,
        reproduceApiBugs: false,
      }),
    );
  });

  it('creates a social network and refuses only a name already taken', async () => {
    const created = await send('POST', '/api/socialnetwork', { descricao: 'TikTok', link: 'https://tiktok.com/@mk' });
    expect(created.status).toBe(201);
    expect(await created.json()).toEqual({ id: 5, descricao: 'TikTok', link: 'https://tiktok.com/@mk' });
    expect(database.socialNetworks).toContainEqual({ id: 5, descricao: 'TikTok', link: 'https://tiktok.com/@mk' });
    expect(onChange).toHaveBeenCalledTimes(1);

    const taken = await send('POST', '/api/socialnetwork', { descricao: 'Instagram', link: 'https://instagram.com/x' });
    expect(taken.status).toBe(409);
    expect(await taken.text()).toBe('Esta rede social já está cadastrada.');
    expect((await send('POST', '/api/socialnetwork', { descricao: 'instagram', link: 'https://i.co' })).status).toBe(
      201,
    );
    expect((await send('POST', '/api/socialnetwork', { descricao: ' ', link: 'https://t.co' })).status).toBe(400);
  });

  it('renames a social network and refuses only a name taken by another network', async () => {
    database.socialNetworks.push({ id: 9, descricao: 'Shopee', link: 'https://shopee.com.br/mk' });

    const kept = await send('PUT', '/api/socialnetwork/Instagram', {
      descricao: 'Instagram',
      link: 'https://instagram.com/novo',
    });
    expect(kept.status).toBe(200);
    expect(await kept.json()).toEqual({ id: 3, descricao: 'Instagram', link: 'https://instagram.com/novo' });

    const renamed = await send('PUT', '/api/socialnetwork/Instagram', { descricao: 'Insta' });
    expect(await renamed.json()).toEqual({ id: 3, descricao: 'Insta', link: 'https://instagram.com/novo' });
    expect(onChange).toHaveBeenCalledTimes(2);

    expect((await send('PUT', '/api/socialnetwork/Insta', { descricao: 'Shopee' })).status).toBe(409);
    expect((await send('PUT', '/api/socialnetwork/Instagram', { descricao: 'Novo' })).status).toBe(409);
    expect(database.socialNetworks.map((socialNetwork) => socialNetwork.descricao)).toEqual(['Insta', 'Shopee']);
  });

  it('deletes a product without purchase link nor category along with its photos', async () => {
    database.purchaseLinks = [];
    database.productCategories = [];
    await uploadPhoto(1, 'frente');
    database.productImages.push({ id: 7, produtoId: 8, imagemUrl: 'http://localhost/local-images/7' });
    await images.save(7, new Blob(['outro'], { type: 'image/png' }));

    expect((await send('DELETE', '/api/produto/1')).status).toBe(200);
    expect(database.products).toEqual([]);
    expect(database.productImages.map((productImage) => productImage.id)).toEqual([7]);
    expect(await images.get(5)).toBeUndefined();
    expect(await images.get(7)).toBeDefined();
  });

  it('deletes the category and purchase links of a deleted product', async () => {
    expect((await send('DELETE', '/api/produto/1')).status).toBe(200);
    expect(database.productCategories).toEqual([]);
    expect(database.purchaseLinks).toEqual([]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('answers 404 when deleting a product that does not exist', async () => {
    expect((await send('DELETE', '/api/produto/99')).status).toBe(404);
    expect(onChange).not.toHaveBeenCalled();
  });
});
