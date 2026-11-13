import { getResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/msw/server';
import { createDatabase, type ApiDatabase } from '../../database';
import { createApiHandlers } from '../../handlers';
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

const UPLOADED_IMAGES = 'https://avphmmvnlrbidhjrzozx.supabase.co/storage/v1/object/public/imagem/upload-';

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
      reproduceApiBugs: true,
    }),
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
    await send('PUT', '/api/canalvendaproduto?produtoId=1&canalVendaId=4', { link: 'https://shopee.com.br/novo' });
    await send('PUT', '/api/socialnetwork/3', { link: 'https://instagram.com/novo' });
    await send('DELETE', '/api/socialnetwork/3');
    await send('DELETE', '/api/canalvenda/6');
    await send('DELETE', '/api/produto/1');
    await send('DELETE', '/api/categoria/2');
    expect(onChange).toHaveBeenCalledTimes(15);
  });

  it('renames a sales channel like the real api: 200 with the row, 409 on a taken name, 404 when unknown', async () => {
    await send('POST', '/api/canalvenda', { nome: 'MagaLu' });

    const renamed = await send('PUT', '/api/canalvenda/4', { nome: 'Shopee BR' });
    expect(renamed.status).toBe(200);
    expect(await renamed.json()).toEqual({ id: 4, nome: 'Shopee BR' });

    expect((await send('PUT', '/api/canalvenda/4', { nome: 'Shopee BR' })).status).toBe(200);
    expect((await send('PUT', '/api/canalvenda/4', { nome: 'MagaLu' })).status).toBe(409);
    expect((await send('PUT', '/api/canalvenda/99', { nome: 'Outro' })).status).toBe(404);
    expect(database.salesChannels).toContainEqual({ id: 4, nome: 'Shopee BR' });
  });

  it('changes only the link of a social network, never its name', async () => {
    const changed = await send('PUT', '/api/socialnetwork/3', {
      descricao: 'Insta',
      link: 'https://instagram.com/novo',
    });
    expect(changed.status).toBe(200);
    expect(await changed.json()).toEqual({ id: 3, descricao: 'Instagram', link: 'https://instagram.com/novo' });

    expect((await send('PUT', '/api/socialnetwork/3', { link: ' ' })).status).toBe(400);
    expect((await send('PUT', '/api/socialnetwork/99', { link: 'https://t.co' })).status).toBe(404);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('changes the link of a product in a sales channel and refuses a pair that does not exist', async () => {
    const changed = await send('PUT', '/api/canalvendaproduto?produtoId=1&canalVendaId=4', {
      link: 'https://shopee.com.br/balde-novo',
    });
    expect(changed.status).toBe(200);
    expect(database.purchaseLinks).toEqual([
      { produtoId: 1, canalVendaId: 4, link: 'https://shopee.com.br/balde-novo' },
    ]);

    expect(
      (await send('PUT', '/api/canalvendaproduto?produtoId=1&canalVendaId=9', { link: 'https://x.com' })).status,
    ).toBe(404);
    expect((await send('PUT', '/api/canalvendaproduto?produtoId=1&canalVendaId=4', { link: ' ' })).status).toBe(400);
    expect(onChange).toHaveBeenCalledTimes(1);
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

  it('keeps an uploaded photo in the image store', async () => {
    const uploaded = await uploadPhoto(1, 'png-bytes');
    expect(uploaded.status).toBe(201);
    expect(await uploaded.json()).toEqual({ id: 5, produtoId: 1, imagemUrl: `${UPLOADED_IMAGES}5` });
    expect(onChange).toHaveBeenCalledTimes(1);

    const stored = await images.get(5);
    expect(stored?.type).toBe('image/png');
    expect(await stored?.text()).toBe('png-bytes');
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

  it('deletes a product without purchase link nor category along with its photos', async () => {
    database.purchaseLinks = [];
    database.productCategories = [];
    await uploadPhoto(1, 'frente');
    database.productImages.push({ id: 7, produtoId: 8, imagemUrl: `${UPLOADED_IMAGES}7` });
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

const STORE = {
  id: 1,
  nomeLoja: 'multikoisas',
  descricaoLoja: 'Tudo em um só lugar',
  endereco: 'Av. Prof. Luiz Inácio de Anhaia Melo, 2085 - Centreville, Santo André - SP',
  corDestaque: null,
  colunaCarrossel: 0,
};

describe('local api store', () => {
  it('finds the store by name ignoring case and answers 404 when there is none', async () => {
    database.stores.push({ ...STORE, id: 2, nomeLoja: 'outra loja' }, { ...STORE });
    expect(await (await send('GET', '/api/loja?nomeLoja=MultiKoisas')).json()).toEqual([STORE]);
    expect((await send('GET', '/api/loja?nomeLoja=nenhuma')).status).toBe(404);
  });

  it('creates the store and changes its description and address by id', async () => {
    const created = await send('POST', '/api/loja', {
      nomeLoja: 'multikoisas',
      descricaoLoja: 'Primeira',
      endereco: 'Rua A, 1',
    });
    expect(created.status).toBe(201);
    expect(await created.json()).toEqual({
      id: 5,
      nomeLoja: 'multikoisas',
      descricaoLoja: 'Primeira',
      endereco: 'Rua A, 1',
      corDestaque: null,
      colunaCarrossel: 0,
    });

    const updated = await send('PUT', '/api/loja/5', { descricaoLoja: 'Segunda', endereco: 'Rua B, 2' });
    expect(updated.status).toBe(200);
    expect(database.stores).toEqual([
      { id: 5, nomeLoja: 'multikoisas', descricaoLoja: 'Segunda', endereco: 'Rua B, 2', corDestaque: null, colunaCarrossel: 0 },
    ]);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('keeps the accent color and the columns sent, and replaces them with empty values when a change leaves them out', async () => {
    database.stores.push({ ...STORE });
    const appearance = { corDestaque: '#22c55e', colunaCarrossel: 3 };
    await send('PUT', '/api/loja/1', { descricaoLoja: 'Outra', endereco: 'Rua C, 3', ...appearance });
    expect(database.stores[0]).toEqual(expect.objectContaining(appearance));

    await send('PUT', '/api/loja/1', { descricaoLoja: 'Outra', endereco: 'Rua C, 3' });
    expect(database.stores[0]).toEqual(expect.objectContaining({ corDestaque: null, colunaCarrossel: 0 }));
  });

  it('refuses a store without name, a name taken and a description change of a missing store', async () => {
    database.stores.push({ ...STORE });
    expect((await send('POST', '/api/loja', { nomeLoja: ' ' })).status).toBe(400);
    expect((await send('POST', '/api/loja', { nomeLoja: 'multikoisas' })).status).toBe(409);
    expect((await send('PUT', '/api/loja/9', { descricaoLoja: 'x' })).status).toBe(404);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('answers 507 and keeps the description and the address when the browser refuses to save them', async () => {
    database.stores.push({ ...STORE });
    onChange.mockReturnValue(false);
    expect((await send('PUT', '/api/loja/1', { descricaoLoja: 'Outra', endereco: 'Rua C, 3' })).status).toBe(507);
    expect(database.stores).toEqual([STORE]);
  });
});

const uploadStoreImage = (tipo: string, content: string, type = 'image/png') =>
  fetch(`/api/imagemloja?tipo=${tipo}`, {
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

describe('local api store images', () => {
  it('lists the images of a type and answers 404 with a message when there is none', async () => {
    database.storeImages.push({ id: 1, imagemUrl: 'URL 1', tipo: 'LOGO' });
    expect(await (await send('GET', '/api/imagemloja?tipo=LOGO')).json()).toEqual([
      { id: 1, imagemUrl: 'URL 1', tipo: 'LOGO' },
    ]);
    const none = await send('GET', '/api/imagemloja?tipo=CAPA');
    expect(none.status).toBe(404);
    expect(await none.json()).toEqual({ message: 'Nenhuma imagem encontrada.' });
  });

  it('keeps an uploaded store image at an https url', async () => {
    const uploaded = await uploadStoreImage('CAPA', 'fachada');
    expect(uploaded.status).toBe(201);
    expect(database.storeImages).toEqual([{ id: 5, imagemUrl: `${UPLOADED_IMAGES}5`, tipo: 'CAPA' }]);
    expect(await (await images.get(5))?.text()).toBe('fachada');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it.each(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])('accepts a %s store image', async (type) => {
    expect((await uploadStoreImage('LOGO', 'bytes', type)).status).toBe(201);
  });

  it('refuses an unknown type, another file type, a file too big or missing', async () => {
    expect((await uploadStoreImage('FUNDO', 'bytes')).status).toBe(400);
    expect((await uploadStoreImage('LOGO', 'gif', 'image/gif')).status).toBe(415);
    expect((await uploadStoreImage('LOGO', 'x'.repeat(5_242_881))).status).toBe(413);
    expect((await uploadStoreImage('LOGO', '')).status).toBe(400);
    expect((await fetch('/api/imagemloja?tipo=LOGO', { method: 'POST', body: new FormData() })).status).toBe(400);
    expect(database.storeImages).toEqual([]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('forgets the upload when the browser refuses to save it', async () => {
    onChange.mockReturnValue(false);
    expect((await uploadStoreImage('LOGO', 'bytes')).status).toBe(507);
    expect(database.storeImages).toEqual([]);
    expect(await images.get(5)).toBeUndefined();
  });

  it('deletes only the store image of the id and answers 404 when the id is missing or of another type', async () => {
    await uploadStoreImage('LOGO', 'bytes');
    await uploadStoreImage('LOGO', 'other');
    expect((await send('DELETE', '/api/imagemloja/5?tipo=CAPA')).status).toBe(404);
    expect((await send('DELETE', '/api/imagemloja/9?tipo=LOGO')).status).toBe(404);
    expect((await send('DELETE', '/api/imagemloja/5?tipo=LOGO')).status).toBe(200);
    expect(database.storeImages).toEqual([{ id: 6, imagemUrl: `${UPLOADED_IMAGES}6`, tipo: 'LOGO' }]);
    expect(await images.get(5)).toBeUndefined();
    expect(onChange).toHaveBeenCalledTimes(3);
  });
});
