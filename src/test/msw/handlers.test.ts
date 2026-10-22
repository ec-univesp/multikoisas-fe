import { describe, expect, it } from 'vitest';
import { apiDatabase } from './apiDatabase';

const SERVER_ORIGIN = 'https://multikoisas-univesp.onrender.com';

const send = (method: string, path: string, body?: unknown) =>
  fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
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
    expect(await (await send('GET', '/api/categoriaproduto?produto=7')).json()).toHaveLength(2);
    expect(await (await send('GET', '/api/categoriaproduto?categoria=3')).json()).toEqual([
      { produtoId: 7, categoriaId: 3 },
    ]);
  });

  it('answers 404 without body for an empty link list (UNIV-28)', async () => {
    const response = await send('GET', '/api/categoriaproduto?produto=5');
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('');
  });

  it('answers 409 when unlinking a link that does not exist (UNIV-29)', async () => {
    const response = await send('DELETE', '/api/categoriaproduto', { produtoId: 5, categoriaId: 2 });
    expect(response.status).toBe(409);
    expect(await response.text()).toBe('O vínculo entre este produto e categoria não existe.');
  });

  it('links and unlinks a product and a category', async () => {
    const linked = await send('POST', '/api/categoriaproduto', { produtoId: 5, categoriaId: 3 });
    expect(linked.status).toBe(201);
    expect(await linked.json()).toEqual({ mensagem: 'Categoria associada ao produto com sucesso.' });
    expect((await send('POST', '/api/categoriaproduto', { produtoId: 5, categoriaId: 3 })).status).toBe(409);
    expect((await send('POST', '/api/categoriaproduto', { produtoId: 404, categoriaId: 3 })).status).toBe(409);

    const unlinked = await send('DELETE', '/api/categoriaproduto', { produtoId: 5, categoriaId: 3 });
    expect(unlinked.status).toBe(200);
    expect(apiDatabase.categoriaProduto).not.toContainEqual({ produtoId: 5, categoriaId: 3 });
  });

  it('creates, renames and deletes a category', async () => {
    const created = await send('POST', '/api/categoria', { nome: 'Lavanderia' });
    expect(created.status).toBe(201);
    expect(await created.json()).toEqual({ id: 100, nome: 'Lavanderia' });
    expect((await send('PUT', '/api/categoria/100', { nome: 'Área de Serviço' })).status).toBe(204);
    expect(apiDatabase.categorias).toContainEqual({ id: 100, nome: 'Área de Serviço' });
    expect((await send('DELETE', '/api/categoria/100')).status).toBe(204);
    expect((await send('DELETE', '/api/categoria/100')).status).toBe(404);
    expect((await send('PUT', '/api/categoria/100', { nome: 'Nada' })).status).toBe(404);
  });

  it('rejects a blank category name and the deletion of a category in use', async () => {
    expect((await send('POST', '/api/categoria', { nome: ' ' })).status).toBe(400);
    expect((await send('PUT', '/api/categoria/3', { nome: '' })).status).toBe(400);
    expect((await send('DELETE', '/api/categoria/3')).status).toBe(409);
  });

  it('creates, updates and deletes a product', async () => {
    const created = await send('POST', '/api/produto', { nome: 'Vassoura', descricaoProduto: 'Macia.' });
    expect(created.status).toBe(201);
    expect(await created.json()).toEqual({ id: 100, nome: 'Vassoura', descricaoProduto: 'Macia.' });
    expect((await send('PUT', '/api/produto/100', { nome: 'Rodo', descricaoProduto: 'Firme.' })).status).toBe(204);
    expect(apiDatabase.produtos).toContainEqual({ id: 100, nome: 'Rodo', descricaoProduto: 'Firme.' });
    expect((await send('DELETE', '/api/produto/100')).status).toBe(204);
    expect((await send('DELETE', '/api/produto/100')).status).toBe(404);
  });

  it('rejects a blank product name and the deletion of a product with categories', async () => {
    expect((await send('POST', '/api/produto', { nome: '', descricaoProduto: 'x' })).status).toBe(400);
    expect((await send('PUT', '/api/produto/404', { nome: 'x', descricaoProduto: 'x' })).status).toBe(404);
    expect((await send('DELETE', '/api/produto/1')).status).toBe(409);
  });
});
