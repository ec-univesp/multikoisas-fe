import { describe, expect, it } from 'vitest';
import { apiDatabase, SUPABASE_IMAGES } from '../../apiDatabase';

const SERVER_ORIGIN = 'https://multikoisas-univesp.onrender.com';

const send = (method: string, path: string, body?: unknown) =>
  fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

// Vitest jsdom replaces the content of every File in FormData: the multipart body is written by hand.
const uploadToProduct5 = (fileName: string, content: string) =>
  fetch('/api/imagem?produtoId=5', {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data; boundary=limite' },
    body: [
      '--limite',
      `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
      'Content-Type: image/png',
      '',
      content,
      '--limite--',
      '',
    ].join('\r\n'),
  });

describe('multikoisas-api handlers', () => {
  it('serves the same route to the server origin and to the browser proxy', async () => {
    const fromServer = await (await send('GET', `${SERVER_ORIGIN}/categoria`)).json();
    const fromBrowser = await (await send('GET', '/api/categoria')).json();
    expect(fromServer).toEqual([
      { id: 2, nome: 'Utensílios de Cozinha' },
      { id: 3, nome: 'Banheiros' },
    ]);
    expect(fromBrowser).toEqual(fromServer);
  });

  it('keeps /categoriaproduto apart from /categoria and /produto', async () => {
    const links = await (await send('GET', `${SERVER_ORIGIN}/categoriaproduto`)).json();
    expect(links).toEqual([
      { produtoId: 1, categoriaId: 2 },
      { produtoId: 7, categoriaId: 2 },
      { produtoId: 7, categoriaId: 3 },
    ]);
  });

  it('filters links by product or category', async () => {
    expect(await (await send('GET', '/api/categoriaproduto?produtoId=7')).json()).toHaveLength(2);
    expect(await (await send('GET', '/api/categoriaproduto?categoriaId=3')).json()).toEqual([
      { produtoId: 7, categoriaId: 3 },
    ]);
  });

  it('answers 404 without body for an empty link list (UNIV-28)', async () => {
    const response = await send('GET', '/api/categoriaproduto?produtoId=5');
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('');
  });

  it('answers 409 when unlinking a link that does not exist (UNIV-29)', async () => {
    const response = await send('DELETE', '/api/categoriaproduto', { produtoId: 5, categoriaId: 2 });
    expect(response.status).toBe(409);
    expect(await response.text()).toBe('O vínculo entre o produto e a categoria nao existe.');
  });

  it('links and unlinks a product and a category', async () => {
    const linked = await send('POST', '/api/categoriaproduto', { produtoId: 5, categoriaId: 3 });
    expect(linked.status).toBe(201);
    expect(await linked.json()).toEqual({ produtoId: 5, categoriaId: 3 });
    expect((await send('POST', '/api/categoriaproduto', { produtoId: 5, categoriaId: 3 })).status).toBe(409);
    expect((await send('POST', '/api/categoriaproduto', { produtoId: 404, categoriaId: 3 })).status).toBe(409);

    const unlinked = await send('DELETE', '/api/categoriaproduto', { produtoId: 5, categoriaId: 3 });
    expect(unlinked.status).toBe(200);
    expect(apiDatabase.productCategories).not.toContainEqual({ produtoId: 5, categoriaId: 3 });
  });

  it('creates, renames and deletes a category', async () => {
    const created = await send('POST', '/api/categoria', { nome: 'Lavanderia' });
    expect(created.status).toBe(201);
    expect(await created.json()).toEqual({ id: 100, nome: 'Lavanderia' });
    expect((await send('PUT', '/api/categoria/100', { nome: 'Área de Serviço' })).status).toBe(204);
    expect(apiDatabase.categories).toContainEqual({ id: 100, nome: 'Área de Serviço' });
    expect((await send('DELETE', '/api/categoria/100')).status).toBe(204);
    expect((await send('DELETE', '/api/categoria/100')).status).toBe(404);
    expect((await send('PUT', '/api/categoria/100', { nome: 'Nada' })).status).toBe(404);
  });

  it('rejects a blank or repeated category name and the deletion of a category in use', async () => {
    expect((await send('POST', '/api/categoria', { nome: ' ' })).status).toBe(400);
    expect((await send('POST', '/api/categoria', { nome: 'Banheiros' })).status).toBe(409);
    expect((await send('PUT', '/api/categoria/3', { nome: '' })).status).toBe(400);
    expect((await send('DELETE', '/api/categoria/3')).status).toBe(409);
  });

  it('creates, updates and deletes a product', async () => {
    const created = await send('POST', '/api/produto', { nome: 'Vassoura', descricaoProduto: 'Macia.' });
    expect(created.status).toBe(201);
    expect(await created.json()).toEqual({ id: 100, nome: 'Vassoura', descricaoProduto: 'Macia.' });
    expect((await send('PUT', '/api/produto/100', { nome: 'Rodo', descricaoProduto: 'Firme.' })).status).toBe(200);
    expect(apiDatabase.products).toContainEqual({ id: 100, nome: 'Rodo', descricaoProduto: 'Firme.' });
    expect((await send('DELETE', '/api/produto/100')).status).toBe(409);
  });

  it('rejects a blank product name and the deletion of a product with categories', async () => {
    expect((await send('POST', '/api/produto', { nome: '', descricaoProduto: 'x' })).status).toBe(400);
    expect((await send('PUT', '/api/produto/404', { nome: 'x', descricaoProduto: 'x' })).status).toBe(404);
  });

  it('deletes a product with its images, store links and categories, and refuses one without them', async () => {
    const deleted = await send('DELETE', '/api/produto/1');
    expect(deleted.status).toBe(200);
    expect(apiDatabase.products.map((product) => product.id)).not.toContain(1);
    expect(apiDatabase.productCategories.some((link) => link.produtoId === 1)).toBe(false);
    expect(apiDatabase.purchaseLinks.some((link) => link.produtoId === 1)).toBe(false);
    expect(apiDatabase.productImages.some((productImage) => productImage.produtoId === 1)).toBe(false);
    for (const produtoId of [5, 404]) {
      const refused = await send('DELETE', `/api/produto/${produtoId}`);
      expect(refused.status).toBe(409);
      expect(await refused.text()).toBe('Nao existe vinculo com o produto.');
    }
  });
  it('reads a product by the id filter and answers 404 for an unknown id', async () => {
    expect(await (await send('GET', '/api/produto?id=5')).json()).toEqual([
      { id: 5, nome: 'Balde 12L', descricaoProduto: 'Resistente.' },
    ]);
    expect((await send('GET', '/api/produto?id=404')).status).toBe(404);
  });

  it('creates a sales channel with an id chosen by the API, renames and deletes it', async () => {
    const created = await send('POST', '/api/canalvenda', { nome: 'Mercado Livre' });
    expect(created.status).toBe(201);
    expect(await created.json()).toEqual({ id: 100, nome: 'Mercado Livre' });
    expect((await send('PUT', '/api/canalvenda/100', { nome: 'Mercado Livre BR' })).status).toBe(204);
    expect(await (await send('GET', '/api/canalvenda?id=100')).json()).toEqual([{ id: 100, nome: 'Mercado Livre BR' }]);
    expect((await send('DELETE', '/api/canalvenda/100')).status).toBe(204);
    expect((await send('DELETE', '/api/canalvenda/100')).status).toBe(404);
  });

  it('rejects a sales channel with a blank or repeated name and the deletion of a channel in use', async () => {
    expect((await send('POST', '/api/canalvenda', { nome: ' ' })).status).toBe(400);
    expect((await send('POST', '/api/canalvenda', { nome: 'shopee' })).status).toBe(201);
    const conflict = await send('POST', '/api/canalvenda', { nome: 'Shopee' });
    expect(conflict.status).toBe(409);
    expect(await conflict.text()).toBe('Já existe um canal com esse nome');
    expect((await send('DELETE', '/api/canalvenda/2')).status).toBe(409);
  });

  it('links a product to a sales channel and answers 204 for an empty link list', async () => {
    expect((await send('GET', '/api/canalvendaproduto?produtoId=5')).status).toBe(204);
    const linked = await send('POST', '/api/canalvendaproduto', {
      produtoId: 5,
      canalVendaId: 4,
      link: 'https://fb.com/balde',
    });
    expect(linked.status).toBe(201);
    expect(await linked.json()).toEqual({ mensagem: 'Canal de venda associado ao produto com sucesso.' });
    expect(await (await send('GET', '/api/canalvendaproduto?produtoId=5')).json()).toEqual([
      { produtoId: 5, canalVendaId: 4, link: 'https://fb.com/balde' },
    ]);
    expect(
      (await send('POST', '/api/canalvendaproduto', { produtoId: 5, canalVendaId: 4, link: 'https://x' })).status,
    ).toBe(409);
    expect(
      (await send('POST', '/api/canalvendaproduto', { produtoId: 404, canalVendaId: 4, link: 'https://x' })).status,
    ).toBe(409);
    expect((await send('POST', '/api/canalvendaproduto', { produtoId: 5, canalVendaId: 3, link: '' })).status).toBe(
      400,
    );
    expect((await send('DELETE', '/api/canalvendaproduto', { produtoId: 5, canalVendaId: 4 })).status).toBe(400);
    expect(
      (await send('DELETE', '/api/canalvendaproduto', { produtoId: 5, canalVendaId: 4, link: 'https://fb.com/balde' }))
        .status,
    ).toBe(200);
    expect(
      (await send('DELETE', '/api/canalvendaproduto', { produtoId: 5, canalVendaId: 4, link: 'https://x' })).status,
    ).toBe(409);
  });

  it('refuses every new social network with 409, like the real api does today', async () => {
    const refused = await send('POST', '/api/socialnetwork', { descricao: 'TikTok', link: 'https://tiktok.com/@mk' });
    expect(refused.status).toBe(409);
    expect(await refused.text()).toBe('Esta rede social já está cadastrada.');
    expect((await send('POST', '/api/socialnetwork', { descricao: '', link: 'https://x' })).status).toBe(400);
    expect((await send('GET', '/api/socialnetwork?name=TikTok')).status).toBe(404);
  });

  it('finds, updates the link and deletes a social network by its exact description', async () => {
    apiDatabase.socialNetworks.push({ id: 7, descricao: 'TikTok', link: 'https://tiktok.com/@mk' });
    expect((await send('GET', '/api/socialnetwork?name=tiktok')).status).toBe(404);
    expect(await (await send('GET', '/api/socialnetwork?name=TikTok')).json()).toEqual([
      { id: 7, descricao: 'TikTok', link: 'https://tiktok.com/@mk' },
    ]);
    const updated = await send('PUT', '/api/socialnetwork/TikTok', { link: 'https://tiktok.com/@multikoisas' });
    expect(await updated.json()).toEqual({ id: 7, descricao: 'TikTok', link: 'https://tiktok.com/@multikoisas' });
    expect((await send('DELETE', '/api/socialnetwork/tiktok')).status).toBe(404);
    expect((await send('DELETE', '/api/socialnetwork/TikTok')).status).toBe(200);
  });

  it('refuses a rename with 409 and an unknown description with 409, like the real api', async () => {
    apiDatabase.socialNetworks.push({ id: 7, descricao: 'TikTok', link: 'https://tiktok.com/@mk' });
    const renamed = await send('PUT', '/api/socialnetwork/TikTok', { descricao: 'Kwai', link: 'https://x' });
    expect(renamed.status).toBe(409);
    expect(await renamed.text()).toBe('Esta rede social já está cadastrada.');
    const unknown = await send('PUT', '/api/socialnetwork/tiktok', { link: 'https://x' });
    expect(unknown.status).toBe(409);
    expect(await unknown.text()).toBe('Descrição não encontrado.');
  });

  it('lists every product image on /imagem and filters them by product', async () => {
    const images = await (await send('GET', `${SERVER_ORIGIN}/imagem`)).json();
    expect(images).toHaveLength(6);
    expect(images).toContainEqual({
      id: 20,
      produtoId: 7,
      imagemUrl: 'https://avphmmvnlrbidhjrzozx.supabase.co/storage/v1/object/public/imagem/caixa.webp',
    });
    const productImages: { produtoId: number }[] = await (await send('GET', '/api/imagem?produtoId=1')).json();
    expect(productImages).toHaveLength(3);
    expect(productImages.every((image) => image.produtoId === 1)).toBe(true);
    expect((await send('GET', '/api/imagem?produtoId=5')).status).toBe(404);
  });

  it('stores a multipart image upload for the product in the query', async () => {
    const created = await uploadToProduct5('balde.png', 'png');
    expect(created.status).toBe(201);
    const image = { id: 100, produtoId: 5, imagemUrl: `${SUPABASE_IMAGES}/upload-100` };
    expect(await created.json()).toEqual(image);
    expect(await (await send('GET', '/api/imagem?produtoId=5')).json()).toEqual([image]);
  });

  it('rejects an upload without file, an empty file and a file above 1 MB', async () => {
    const withoutFile = new FormData();
    expect((await fetch('/api/imagem?produtoId=5', { method: 'POST', body: withoutFile })).status).toBe(400);
    expect((await uploadToProduct5('vazio.png', '')).status).toBe(409);
    expect((await uploadToProduct5('grande.png', 'x'.repeat(1_048_577))).status).toBe(413);
    expect(apiDatabase.productImages.filter((image) => image.produtoId === 5)).toEqual([]);
  });

  it('deletes an image by id and product', async () => {
    expect((await send('DELETE', '/api/imagem', { id: 20, produtoId: 7 })).status).toBe(204);
    expect(apiDatabase.productImages.map((image) => image.id)).not.toContain(20);
    expect((await send('DELETE', '/api/imagem', { id: 20, produtoId: 7 })).status).toBe(409);
    expect((await send('DELETE', '/api/imagem', { id: 21, produtoId: 1 })).status).toBe(409);
  });
});
