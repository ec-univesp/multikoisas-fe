import { http, HttpResponse } from 'msw';
import { apiDatabase, SUPABASE_IMAGES, type CanalVendaProdutoRow, type CategoriaProdutoRow } from './apiDatabase';

// Corpo de erro padrão do Spring Boot para ResponseStatusException.
const springError = (status: number, error: string, request: Request) =>
  HttpResponse.json(
    { timestamp: new Date().toISOString(), status, error, path: new URL(request.url).pathname },
    { status },
  );

// A API responde 404 sem corpo para lista vazia; /canalvendaproduto responde 204.
const listResponse = <Row,>(rows: readonly Row[], emptyStatus = 404) =>
  rows.length === 0 ? new HttpResponse(null, { status: emptyStatus }) : HttpResponse.json(rows);

const queryOf = (request: Request) => new URL(request.url).searchParams;

const matchesNumber = (filter: string | null, value: number) => filter === null || value === Number(filter);

const matchesText = (filter: string | null, value: string) =>
  filter === null || filter.trim() === '' || value.toLowerCase() === filter.trim().toLowerCase();

type NomeBody = { nome?: string };
type ProdutoBody = { nome?: string; descricaoProduto?: string };
type ImagemBody = { id?: number; produtoId?: number };
type RedeSocialBody = { descricao?: string; link?: string };

const MAX_UPLOAD_BYTES = 1_048_576;

export const TEST_API_CREDENTIALS = { username: 'api-admin', password: 'api-secret', token: 'jwt-de-teste' };

export const handlers = [
  http.post<never, { username?: string; password?: string }>('*/auth/login', async ({ request }) => {
    const { username, password } = await request.json();
    if (username !== TEST_API_CREDENTIALS.username || password !== TEST_API_CREDENTIALS.password) {
      return springError(403, 'Forbidden', request);
    }
    return HttpResponse.json({ token: TEST_API_CREDENTIALS.token });
  }),

  http.get('*/produto', ({ request }) => {
    const id = queryOf(request).get('id');
    return listResponse(apiDatabase.produtos.filter((produto) => matchesNumber(id, produto.id)));
  }),

  http.post<never, ProdutoBody>('*/produto', async ({ request }) => {
    const { nome, descricaoProduto = '' } = await request.json();
    if (!nome?.trim()) return springError(400, 'Bad Request', request);
    const produto = { id: apiDatabase.nextId++, nome, descricaoProduto };
    apiDatabase.produtos.push(produto);
    return HttpResponse.json(produto, { status: 201 });
  }),

  http.put<{ id: string }, ProdutoBody>('*/produto/:id', async ({ request, params }) => {
    const { nome, descricaoProduto = '' } = await request.json();
    if (!nome?.trim()) return springError(400, 'Bad Request', request);
    const produto = apiDatabase.produtos.find((candidate) => candidate.id === Number(params.id));
    if (!produto) return springError(404, 'Not Found', request);
    Object.assign(produto, { nome, descricaoProduto });
    return HttpResponse.json(produto);
  }),

  http.delete('*/produto/:id', ({ request, params }) => {
    const id = Number(params.id);
    if (!apiDatabase.produtos.some((produto) => produto.id === id)) return springError(404, 'Not Found', request);
    if (apiDatabase.categoriaProduto.some((link) => link.produtoId === id)) {
      return springError(409, 'Conflict', request);
    }
    apiDatabase.produtos = apiDatabase.produtos.filter((produto) => produto.id !== id);
    return HttpResponse.json({ message: `O produto ${id} deletado com sucesso.` });
  }),

  http.get('*/categoria', ({ request }) => {
    const query = queryOf(request);
    return listResponse(
      apiDatabase.categorias.filter(
        (categoria) =>
          matchesNumber(query.get('categoriaId'), categoria.id) && matchesText(query.get('nome'), categoria.nome),
      ),
    );
  }),

  http.post<never, NomeBody>('*/categoria', async ({ request }) => {
    const { nome } = await request.json();
    if (!nome?.trim()) return springError(400, 'Bad Request', request);
    const categoria = { id: apiDatabase.nextId++, nome };
    apiDatabase.categorias.push(categoria);
    return HttpResponse.json(categoria, { status: 201 });
  }),

  http.put<{ id: string }, NomeBody>('*/categoria/:id', async ({ request, params }) => {
    const { nome } = await request.json();
    if (!nome?.trim()) return springError(400, 'Bad Request', request);
    const categoria = apiDatabase.categorias.find((candidate) => candidate.id === Number(params.id));
    if (!categoria) return springError(404, 'Not Found', request);
    categoria.nome = nome;
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete('*/categoria/:id', ({ request, params }) => {
    const id = Number(params.id);
    if (!apiDatabase.categorias.some((categoria) => categoria.id === id)) return springError(404, 'Not Found', request);
    if (apiDatabase.categoriaProduto.some((link) => link.categoriaId === id)) {
      return springError(409, 'Conflict', request);
    }
    apiDatabase.categorias = apiDatabase.categorias.filter((categoria) => categoria.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('*/categoriaproduto', ({ request }) => {
    const query = queryOf(request);
    return listResponse(
      apiDatabase.categoriaProduto.filter(
        (link) =>
          matchesNumber(query.get('produtoId'), link.produtoId) &&
          matchesNumber(query.get('categoriaId'), link.categoriaId),
      ),
    );
  }),

  http.post<never, CategoriaProdutoRow>('*/categoriaproduto', async ({ request }) => {
    const { produtoId, categoriaId } = await request.json();
    if (apiDatabase.categoriaProduto.some((link) => link.produtoId === produtoId && link.categoriaId === categoriaId)) {
      return HttpResponse.text('Este produto já está associado a esta categoria.', { status: 409 });
    }
    const produtoExists = apiDatabase.produtos.some((produto) => produto.id === produtoId);
    const categoriaExists = apiDatabase.categorias.some((categoria) => categoria.id === categoriaId);
    if (!produtoExists || !categoriaExists) {
      return HttpResponse.text('Produto ou categoria inexistente. Verifique os IDs informados.', { status: 409 });
    }
    apiDatabase.categoriaProduto.push({ produtoId, categoriaId });
    return HttpResponse.json({ produtoId, categoriaId }, { status: 201 });
  }),

  http.delete<never, CategoriaProdutoRow>('*/categoriaproduto', async ({ request }) => {
    const { produtoId, categoriaId } = await request.json();
    const remaining = apiDatabase.categoriaProduto.filter(
      (link) => !(link.produtoId === produtoId && link.categoriaId === categoriaId),
    );
    if (remaining.length === apiDatabase.categoriaProduto.length) {
      return HttpResponse.text('O vínculo entre o produto e a categoria nao existe.', { status: 409 });
    }
    apiDatabase.categoriaProduto = remaining;
    return HttpResponse.json({ mensagem: 'Categoria desassociada do produto com sucesso.' });
  }),

  http.get('*/imagem', ({ request }) => {
    const produtoId = queryOf(request).get('produtoId');
    return listResponse(apiDatabase.imagens.filter((imagem) => matchesNumber(produtoId, imagem.produtoId)));
  }),

  http.post('*/imagem', async ({ request }) => {
    const produtoId = queryOf(request).get('produtoId');
    if (produtoId === null) return springError(400, 'Bad Request', request);
    const form = await request.formData();
    const file = form.get('file');
    if (file === null || typeof file === 'string') return springError(400, 'Bad Request', request);
    if (file.size === 0) return HttpResponse.text('O arquivo enviado está vazio.', { status: 409 });
    if (file.size > MAX_UPLOAD_BYTES) return springError(413, 'Payload Too Large', request);
    const id = apiDatabase.nextId++;
    // O jsdom do Vitest troca o nome do arquivo por "blob" no multipart.
    const imagem = { id, produtoId: Number(produtoId), imagemUrl: `${SUPABASE_IMAGES}/upload-${id}` };
    apiDatabase.imagens.push(imagem);
    return HttpResponse.json(imagem, { status: 201 });
  }),

  http.delete<never, ImagemBody>('*/imagem', async ({ request }) => {
    const { id, produtoId } = await request.json();
    const remaining = apiDatabase.imagens.filter((imagem) => !(imagem.id === id && imagem.produtoId === produtoId));
    if (remaining.length === apiDatabase.imagens.length) return springError(404, 'Not Found', request);
    apiDatabase.imagens = remaining;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('*/socialnetwork', ({ request }) => {
    const name = queryOf(request).get('name');
    return listResponse(apiDatabase.redesSociais.filter((redeSocial) => matchesText(name, redeSocial.descricao)));
  }),

  http.post<never, RedeSocialBody>('*/socialnetwork', async ({ request }) => {
    const { descricao, link } = await request.json();
    if (!descricao?.trim() || !link?.trim()) return springError(400, 'Bad Request', request);
    if (apiDatabase.redesSociais.some((redeSocial) => matchesText(descricao, redeSocial.descricao))) {
      return HttpResponse.text('Esta rede social já está cadastrada.', { status: 409 });
    }
    apiDatabase.redesSociais.push({ id: apiDatabase.nextId++, descricao: descricao.trim(), link: link.trim() });
    return new HttpResponse(null, { status: 201 });
  }),

  http.put<{ description: string }, RedeSocialBody>('*/socialnetwork/:description', async ({ request, params }) => {
    const { descricao, link } = await request.json();
    const redeSocial = apiDatabase.redesSociais.find((candidate) => matchesText(params.description, candidate.descricao));
    if (!redeSocial) return HttpResponse.text('Descrição não encontrado.', { status: 409 });
    if (descricao?.trim()) redeSocial.descricao = descricao.trim();
    if (link?.trim()) redeSocial.link = link.trim();
    return HttpResponse.json(redeSocial);
  }),

  http.delete<{ description: string }>('*/socialnetwork/:description', ({ request, params }) => {
    const remaining = apiDatabase.redesSociais.filter(
      (redeSocial) => !matchesText(params.description, redeSocial.descricao),
    );
    if (remaining.length === apiDatabase.redesSociais.length) return springError(404, 'Not Found', request);
    apiDatabase.redesSociais = remaining;
    return HttpResponse.json({ message: `Rede social ${params.description} deletada com sucesso.` });
  }),

  http.get('*/canalvenda', ({ request }) => {
    const query = queryOf(request);
    return listResponse(
      apiDatabase.canaisVenda.filter(
        (canalVenda) => matchesNumber(query.get('id'), canalVenda.id) && matchesText(query.get('nome'), canalVenda.nome),
      ),
    );
  }),

  http.post<never, NomeBody>('*/canalvenda', async ({ request }) => {
    const { nome } = await request.json();
    if (!nome?.trim()) return springError(400, 'Bad Request', request);
    if (apiDatabase.canaisVenda.some((canalVenda) => matchesText(nome, canalVenda.nome))) {
      return HttpResponse.text('Já existe um canal com esse nome', { status: 409 });
    }
    const canalVenda = { id: apiDatabase.nextId++, nome };
    apiDatabase.canaisVenda.push(canalVenda);
    return HttpResponse.json(canalVenda, { status: 201 });
  }),

  http.put<{ id: string }, NomeBody>('*/canalvenda/:id', async ({ request, params }) => {
    const { nome } = await request.json();
    if (!nome?.trim()) return springError(400, 'Bad Request', request);
    const canalVenda = apiDatabase.canaisVenda.find((candidate) => candidate.id === Number(params.id));
    if (!canalVenda) return springError(404, 'Not Found', request);
    canalVenda.nome = nome;
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete('*/canalvenda/:id', ({ request, params }) => {
    const id = Number(params.id);
    if (!apiDatabase.canaisVenda.some((canalVenda) => canalVenda.id === id)) {
      return springError(404, 'Not Found', request);
    }
    if (apiDatabase.canalVendaProduto.some((link) => link.canalVendaId === id)) {
      return springError(409, 'Conflict', request);
    }
    apiDatabase.canaisVenda = apiDatabase.canaisVenda.filter((canalVenda) => canalVenda.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('*/canalvendaproduto', ({ request }) => {
    const query = queryOf(request);
    return listResponse(
      apiDatabase.canalVendaProduto.filter(
        (link) =>
          matchesNumber(query.get('produtoId'), link.produtoId) &&
          matchesNumber(query.get('canalVendaId'), link.canalVendaId),
      ),
      204,
    );
  }),

  http.post<never, CanalVendaProdutoRow>('*/canalvendaproduto', async ({ request }) => {
    const { produtoId, canalVendaId, link } = await request.json();
    if (!link?.trim()) return springError(400, 'Bad Request', request);
    if (
      apiDatabase.canalVendaProduto.some(
        (candidate) => candidate.produtoId === produtoId && candidate.canalVendaId === canalVendaId,
      )
    ) {
      return HttpResponse.text('Este produto já está associado a este canal de venda.', { status: 409 });
    }
    const produtoExists = apiDatabase.produtos.some((produto) => produto.id === produtoId);
    const canalExists = apiDatabase.canaisVenda.some((canalVenda) => canalVenda.id === canalVendaId);
    if (!produtoExists || !canalExists) {
      return HttpResponse.text('Produto ou canal de venda inexistente. Verifique os IDs informados.', { status: 409 });
    }
    const row = { produtoId, canalVendaId, link };
    apiDatabase.canalVendaProduto.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),

  http.delete<never, CanalVendaProdutoRow>('*/canalvendaproduto', async ({ request }) => {
    const { produtoId, canalVendaId } = await request.json();
    const remaining = apiDatabase.canalVendaProduto.filter(
      (link) => !(link.produtoId === produtoId && link.canalVendaId === canalVendaId),
    );
    if (remaining.length === apiDatabase.canalVendaProduto.length) {
      return HttpResponse.text('O vínculo entre este produto e canal de venda não existe.', { status: 409 });
    }
    apiDatabase.canalVendaProduto = remaining;
    return HttpResponse.json({ mensagem: 'Canal de venda desassociado do produto com sucesso.' });
  }),
];
