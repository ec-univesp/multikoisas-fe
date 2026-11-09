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
const uploadPhoto = (produtoId: number, content: string, type = 'image/png') =>
  fetch(`/api/imagem?produtoId=${produtoId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data; boundary=limite' },
    body: [
      '--limite',
      'Content-Disposition: form-data; name="file"; filename="foto.png"',
      `Content-Type: ${type}`,
      '',
      content,
      '--limite--',
      '',
    ].join('\r\n'),
  });

const uploadLogo = (content: string, type = 'image/png') =>
  fetch('/api/configuracao/logo', {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data; boundary=limite' },
    body: [
      '--limite',
      'Content-Disposition: form-data; name="file"; filename="logo.png"',
      `Content-Type: ${type}`,
      '',
      content,
      '--limite--',
      '',
    ].join('\r\n'),
  });

const VALID_SETTINGS = { address: 'Rua Nova, 10 - Santo André - SP' };
const SEED_ADDRESS = 'Av. Prof. Luiz Inácio de Anhaia Melo, 2085 - Centreville, Santo André - SP';

let database: ApiDatabase;
let images: ImageStore;
const onChange = vi.fn(() => true);

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

  it('answers 507 when the browser refuses to save a write', async () => {
    onChange.mockReturnValue(false);
    const created = await send('POST', '/api/categoria', { nome: 'Jardim' });
    expect(created.status).toBe(507);
    expect(await created.text()).toBe('Espaço do navegador cheio');
  });

  it('forgets the stored photo when the browser refuses to save its upload', async () => {
    onChange.mockReturnValue(false);
    expect((await uploadPhoto(1, 'png-bytes')).status).toBe(507);
    expect(await images.get(5)).toBeUndefined();
    expect(database.productImages).toEqual([]);
  });

  it.each(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])('accepts a %s photo', async (type) => {
    expect((await uploadPhoto(1, 'bytes', type)).status).toBe(201);
  });

  it('refuses a file that is not a photo', async () => {
    expect((await uploadPhoto(1, '<script>alert(1)</script>', 'text/html')).status).toBe(415);
    expect(await images.get(5)).toBeUndefined();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('serves a stored file of another type as plain bytes', async () => {
    await images.save(9, new Blob(['<script>alert(1)</script>'], { type: 'text/html' }));
    expect((await fetch('/local-images/9')).headers.get('content-type')).toBe('application/octet-stream');
  });

  it('deletes a product even when a stored photo cannot be removed, and leaves remote photos alone', async () => {
    database.productImages.push({ id: 8, produtoId: 1, imagemUrl: 'https://res.cloudinary.com/mk/balde.png' });
    await images.save(8, new Blob(['outra'], { type: 'image/png' }));
    await uploadPhoto(1, 'frente');
    const remove = vi.spyOn(images, 'remove');
    remove.mockRejectedValueOnce(new Error('indexeddb closed'));

    expect((await send('DELETE', '/api/produto/1')).status).toBe(200);
    expect(remove.mock.calls).toEqual([[5]]);
    expect(database.products).toEqual([]);
    expect(database.productImages).toEqual([]);
    expect(await images.get(8)).toBeDefined();
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

const ADMIN = { id: 8, username: 'admin', email: 'pi2alunos@gmail.com', role: 'ADMIN' };

const NEW_USER = { username: 'maria', email: 'maria@multikoisas.com', password: 'segredo', role: 'USER' };

describe('local api users', () => {
  beforeEach(() => {
    database.users.push({ ...ADMIN });
  });

  it('lists the users and filters by id or username', async () => {
    expect(await (await send('GET', '/api/user')).json()).toEqual([ADMIN]);
    expect(await (await send('GET', '/api/user?username=admin')).json()).toEqual([ADMIN]);
    expect(await (await send('GET', '/api/user?id=8')).json()).toEqual([ADMIN]);
    const missing = await send('GET', '/api/user?username=ninguem');
    expect(missing.status).toBe(404);
    expect(await missing.text()).toBe('');
  });

  it('creates a user without keeping the password', async () => {
    const created = await send('POST', '/api/user', NEW_USER);
    expect(created.status).toBe(201);
    expect(await created.text()).toBe('usuario cadastrado com sucesso');
    expect(database.users).toContainEqual({ id: 5, username: 'maria', email: 'maria@multikoisas.com', role: 'USER' });
    expect(JSON.stringify(database)).not.toContain('segredo');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('answers 400 with a message for every blank field', async () => {
    const refused = await send('POST', '/api/user', { username: ' ', email: '' });
    expect(refused.status).toBe(400);
    expect(await refused.json()).toEqual({
      email: 'O campo email e obrigatorio',
      username: 'O campo username e obrigatorio',
      password: 'O campo password e obrigatoria',
      role: 'o campo role e obrigatorio',
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('refuses a username or an e-mail already taken', async () => {
    const usernameTaken = await send('POST', '/api/user', { ...NEW_USER, username: 'admin' });
    expect(usernameTaken.status).toBe(409);
    expect(await usernameTaken.text()).toBe('Este nome de usuário já está em uso.');

    const emailTaken = await send('POST', '/api/user', { ...NEW_USER, email: 'pi2alunos@gmail.com' });
    expect(emailTaken.status).toBe(409);
    expect(await emailTaken.text()).toBe('Já existe um usuário cadastrado com este e-mail.');
    expect(database.users).toHaveLength(1);
  });

  it('updates the e-mail, keeps the blank fields and ignores the role like the api', async () => {
    database.users.push({ id: 9, username: 'maria', email: 'maria@multikoisas.com', role: 'USER' });

    const updated = await send('PUT', '/api/user/admin', {
      email: 'maria@multikoisas.com',
      password: '',
      role: 'USER',
    });

    expect(updated.status).toBe(200);
    expect(await updated.json()).toEqual({ ...ADMIN, email: 'maria@multikoisas.com' });
    const kept = await send('PUT', '/api/user/admin', { email: ' ', password: 'nova' });
    expect(await kept.json()).toEqual({ ...ADMIN, email: 'maria@multikoisas.com' });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('answers 409 when updating a user that does not exist', async () => {
    const missing = await send('PUT', '/api/user/ninguem', { email: 'x@y.com' });
    expect(missing.status).toBe(409);
    expect(await missing.text()).toBe('Usuário não encontrado.');
  });

  it('deletes a user and answers 404 when it does not exist', async () => {
    const deleted = await send('DELETE', '/api/user/admin');
    expect(deleted.status).toBe(200);
    expect(await deleted.json()).toEqual({ message: 'Usuario admin deletado com sucesso.' });
    expect(database.users).toEqual([]);
    const missing = await send('DELETE', '/api/user/admin');
    expect(missing.status).toBe(404);
    expect(await missing.text()).toBe('');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('filters by id alone when id and username are both sent, like the java api', async () => {
    expect(await (await send('GET', '/api/user?id=8&username=outro')).json()).toEqual([ADMIN]);
  });
});

describe('local api users without the api bugs', () => {
  beforeEach(() => {
    database.users.push({ ...ADMIN }, { id: 9, username: 'maria', email: 'maria@multikoisas.com', role: 'USER' });
    server.use(
      ...createApiHandlers(database, {
        baseUrl: '/api',
        onChange,
        images,
        imageUrl: String,
        reproduceApiBugs: false,
      }),
    );
  });

  it('changes the role of a user', async () => {
    const updated = await send('PUT', '/api/user/maria', { role: 'ADMIN' });
    expect(await updated.json()).toEqual({ id: 9, username: 'maria', email: 'maria@multikoisas.com', role: 'ADMIN' });
  });

  it('refuses an e-mail taken by another user and accepts the same e-mail', async () => {
    const taken = await send('PUT', '/api/user/maria', { email: 'pi2alunos@gmail.com' });
    expect(taken.status).toBe(409);
    expect(await taken.text()).toBe('Este e-mail já está em uso por outra conta.');
    expect((await send('PUT', '/api/user/admin', { email: 'pi2alunos@gmail.com' })).status).toBe(200);
  });
});

describe('local api store settings', () => {
  it('reads the store settings', async () => {
    const answer = await send('GET', '/api/configuracao');
    expect(answer.status).toBe(200);
    expect(await answer.json()).toEqual({ address: SEED_ADDRESS, logoUrl: null });
  });

  it('saves the store settings and keeps the logo', async () => {
    database.storeSettings.logoUrl = '/local-images/50';
    const saved = await send('PUT', '/api/configuracao', VALID_SETTINGS);
    expect(saved.status).toBe(200);
    expect(await saved.json()).toEqual({ ...VALID_SETTINGS, logoUrl: '/local-images/50' });
    expect(database.storeSettings).toEqual({ ...VALID_SETTINGS, logoUrl: '/local-images/50' });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('saves empty fields as missing', async () => {
    expect((await send('PUT', '/api/configuracao', { address: ' ' })).status).toBe(200);
    expect(database.storeSettings).toEqual({ address: null, logoUrl: null });
  });

  it.each([{ address: 10 }])('refuses invalid store settings %o', async (invalidField) => {
    const refused = await send('PUT', '/api/configuracao', { ...VALID_SETTINGS, ...invalidField });
    expect(refused.status).toBe(400);
    expect(database.storeSettings.address).toBe(SEED_ADDRESS);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('answers 507 and keeps the settings when the browser refuses to save them', async () => {
    onChange.mockReturnValue(false);
    expect((await send('PUT', '/api/configuracao', VALID_SETTINGS)).status).toBe(507);
    expect(database.storeSettings.address).toBe(SEED_ADDRESS);
  });

  it.each(['null', '[]', '"Rua Nova"'])('refuses the store settings body %s', async (body) => {
    const refused = await fetch('/api/configuracao', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    expect(refused.status).toBe(400);
    expect(database.storeSettings.address).toBe(SEED_ADDRESS);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps the omitted store settings and clears the ones sent empty', async () => {
    expect((await send('PUT', '/api/configuracao', {})).status).toBe(200);
    expect(database.storeSettings.address).toBe(SEED_ADDRESS);
    expect((await send('PUT', '/api/configuracao', { address: null })).status).toBe(200);
    expect(database.storeSettings.address).toBeNull();
  });

  it('ignores the google fields the store no longer keeps', async () => {
    expect((await send('PUT', '/api/configuracao', { ...VALID_SETTINGS, googleRating: 4.9 })).status).toBe(200);
    expect(database.storeSettings).toEqual({ ...VALID_SETTINGS, logoUrl: null });
  });

  it('keeps an uploaded logo in the image store, serves it and forgets the previous one', async () => {
    const first = await uploadLogo('primeira');
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual(expect.objectContaining({ logoUrl: '/local-images/5' }));

    expect((await uploadLogo('<svg/>', 'image/svg+xml')).status).toBe(200);
    expect(database.storeSettings.logoUrl).toBe('/local-images/6');
    expect(await images.get(5)).toBeUndefined();
    const served = await fetch('/local-images/6');
    expect(served.headers.get('content-type')).toBe('image/svg+xml');
    expect(await served.text()).toBe('<svg/>');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it.each(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])('accepts a %s logo', async (type) => {
    expect((await uploadLogo('bytes', type)).status).toBe(200);
  });

  it('refuses a logo of another type, too big or missing', async () => {
    expect((await uploadLogo('gif', 'image/gif')).status).toBe(415);
    expect((await uploadLogo('x'.repeat(1_048_577))).status).toBe(413);
    expect((await uploadLogo('')).status).toBe(400);
    expect((await fetch('/api/configuracao/logo', { method: 'POST', body: new FormData() })).status).toBe(400);
    expect(database.storeSettings.logoUrl).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps the previous logo when the browser refuses to save the new one', async () => {
    await uploadLogo('primeira');
    onChange.mockReturnValue(false);
    expect((await uploadLogo('segunda')).status).toBe(507);
    expect(database.storeSettings.logoUrl).toBe('/local-images/5');
    expect(await images.get(5)).toBeDefined();
    expect(await images.get(6)).toBeUndefined();
  });

  it('goes back to the default logo and forgets the stored one', async () => {
    await uploadLogo('primeira');
    const removed = await send('DELETE', '/api/configuracao/logo');
    expect(removed.status).toBe(200);
    expect(await removed.json()).toEqual(expect.objectContaining({ logoUrl: null }));
    expect(database.storeSettings.logoUrl).toBeNull();
    expect(await images.get(5)).toBeUndefined();
    expect((await send('DELETE', '/api/configuracao/logo')).status).toBe(200);
  });

  it('keeps the logo when the browser refuses to save the default one', async () => {
    await uploadLogo('primeira');
    onChange.mockReturnValue(false);
    expect((await send('DELETE', '/api/configuracao/logo')).status).toBe(507);
    expect(database.storeSettings.logoUrl).toBe('/local-images/5');
    expect(await images.get(5)).toBeDefined();
  });
});
