import { http, HttpResponse } from 'msw';
import { apiDatabase, type CategoriaProdutoRow } from './apiDatabase';

// Corpo de erro padrão do Spring Boot para ResponseStatusException.
const springError = (status: number, error: string, request: Request) =>
  HttpResponse.json(
    { timestamp: new Date().toISOString(), status, error, path: new URL(request.url).pathname },
    { status },
  );

type NomeBody = { nome?: string };
type CanalVendaBody = { id?: number; nome?: string };
type ProdutoBody = { nome?: string; descricaoProduto?: string };

export const handlers = [
  http.get('*/produto', () => HttpResponse.json(apiDatabase.produtos)),

  http.get('*/produto/:id', ({ request, params }) => {
    const produto = apiDatabase.produtos.find((candidate) => candidate.id === Number(params.id));
    return produto ? HttpResponse.json(produto) : springError(404, 'Not Found', request);
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
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete('*/produto/:id', ({ request, params }) => {
    const id = Number(params.id);
    if (!apiDatabase.produtos.some((produto) => produto.id === id)) return springError(404, 'Not Found', request);
    if (apiDatabase.categoriaProduto.some((link) => link.produtoId === id)) {
      return springError(409, 'Conflict', request);
    }
    apiDatabase.produtos = apiDatabase.produtos.filter((produto) => produto.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('*/categoria', () => HttpResponse.json(apiDatabase.categorias)),

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
    const query = new URL(request.url).searchParams;
    const produto = query.get('produto');
    const categoria = query.get('categoria');
    const links = apiDatabase.categoriaProduto.filter(
      (link) =>
        (produto === null || link.produtoId === Number(produto)) &&
        (categoria === null || link.categoriaId === Number(categoria)),
    );
    // A API responde 404 sem corpo para lista vazia (UNIV-28 no santi).
    if (links.length === 0) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(links);
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
    return HttpResponse.json({ mensagem: 'Categoria associada ao produto com sucesso.' }, { status: 201 });
  }),

  http.delete<never, CategoriaProdutoRow>('*/categoriaproduto', async ({ request }) => {
    const { produtoId, categoriaId } = await request.json();
    const remaining = apiDatabase.categoriaProduto.filter(
      (link) => !(link.produtoId === produtoId && link.categoriaId === categoriaId),
    );
    // A API responde 409, e não 404, para vínculo inexistente (UNIV-29 no santi).
    if (remaining.length === apiDatabase.categoriaProduto.length) {
      return HttpResponse.text('O vínculo entre este produto e categoria não existe.', { status: 409 });
    }
    apiDatabase.categoriaProduto = remaining;
    return HttpResponse.json({ mensagem: 'Categoria desassociada do produto com sucesso.' });
  }),

  http.get('*/imagem', () => HttpResponse.json(apiDatabase.imagens)),

  http.get('*/imagem/:produtoId', ({ params }) =>
    HttpResponse.json(apiDatabase.imagens.filter((imagem) => imagem.produtoId === Number(params.produtoId))),
  ),

  http.get('*/socialnetwork', () => HttpResponse.json(apiDatabase.redesSociais)),

  http.get('*/canalvenda', () => HttpResponse.json(apiDatabase.canaisVenda)),

  // A API exige o id no corpo: ela não gera o id do canal.
  http.post<never, CanalVendaBody>('*/canalvenda', async ({ request }) => {
    const { id, nome } = await request.json();
    if (typeof id !== 'number' || !Number.isInteger(id) || !nome?.trim()) return springError(400, 'Bad Request', request);
    if (apiDatabase.canaisVenda.some((canalVenda) => canalVenda.id === id)) {
      return springError(409, 'Conflict', request);
    }
    const canalVenda = { id, nome };
    apiDatabase.canaisVenda.push(canalVenda);
    return HttpResponse.json(canalVenda, { status: 201 });
  }),

  // O SecurityConfig da API publicada não libera PUT em /canalvenda (UNIV-16 no santi).
  http.put('*/canalvenda/:id', ({ request }) => springError(403, 'Forbidden', request)),

  http.delete('*/canalvenda/:id', ({ request, params }) => {
    const id = Number(params.id);
    if (!apiDatabase.canaisVenda.some((canalVenda) => canalVenda.id === id)) {
      return springError(404, 'Not Found', request);
    }
    apiDatabase.canaisVenda = apiDatabase.canaisVenda.filter((canalVenda) => canalVenda.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),
];
