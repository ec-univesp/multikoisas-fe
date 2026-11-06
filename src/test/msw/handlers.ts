import { http, HttpResponse } from 'msw';
import { apiDatabase, SUPABASE_IMAGES, type PurchaseLinkRow, type ProductCategoryRow } from './apiDatabase';

// Corpo de erro padrão do Spring Boot para ResponseStatusException.
const springError = (status: number, error: string, request: Request) =>
  HttpResponse.json(
    { timestamp: new Date().toISOString(), status, error, path: new URL(request.url).pathname },
    { status },
  );

// A API responde 404 sem corpo para lista vazia; /canalvendaproduto responde 204.
const listResponse = <Row>(rows: readonly Row[], emptyStatus = 404) =>
  rows.length === 0 ? new HttpResponse(null, { status: emptyStatus }) : HttpResponse.json(rows);

const queryOf = (request: Request) => new URL(request.url).searchParams;

const matchesNumber = (filter: string | null, value: number) => filter === null || value === Number(filter);

const matchesText = (filter: string | null, value: string) =>
  filter === null || filter.trim() === '' || value.toLowerCase() === filter.trim().toLowerCase();

type NameBody = { nome?: string };
type ProductBody = { nome?: string; descricaoProduto?: string };
type ProductImageBody = { id?: number; produtoId?: number };
type SocialNetworkBody = { descricao?: string; link?: string };

const SOCIAL_NETWORK_TAKEN = 'Esta rede social já está cadastrada.';

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
    return listResponse(apiDatabase.products.filter((product) => matchesNumber(id, product.id)));
  }),

  http.post<never, ProductBody>('*/produto', async ({ request }) => {
    const { nome, descricaoProduto = '' } = await request.json();
    if (!nome?.trim()) return springError(400, 'Bad Request', request);
    const product = { id: apiDatabase.nextId++, nome, descricaoProduto };
    apiDatabase.products.push(product);
    return HttpResponse.json(product, { status: 201 });
  }),

  http.put<{ id: string }, ProductBody>('*/produto/:id', async ({ request, params }) => {
    const { nome, descricaoProduto = '' } = await request.json();
    if (!nome?.trim()) return springError(400, 'Bad Request', request);
    const product = apiDatabase.products.find((candidate) => candidate.id === Number(params.id));
    if (!product) return springError(404, 'Not Found', request);
    Object.assign(product, { nome, descricaoProduto });
    return HttpResponse.json(product);
  }),

  // A API apaga fotos, links e categorias junto; sem link de compra ou sem categoria ela desfaz tudo e responde 409.
  http.delete('*/produto/:id', ({ params }) => {
    const id = Number(params.id);
    const hasPurchaseLink = apiDatabase.purchaseLinks.some((link) => link.produtoId === id);
    const hasCategory = apiDatabase.productCategories.some((link) => link.produtoId === id);
    if (!hasPurchaseLink) return HttpResponse.text('Nao existe vinculo com o produto.', { status: 409 });
    if (!hasCategory) return HttpResponse.text('Nao existe vínculo com esse produto.', { status: 409 });
    apiDatabase.productImages = apiDatabase.productImages.filter((productImage) => productImage.produtoId !== id);
    apiDatabase.purchaseLinks = apiDatabase.purchaseLinks.filter((link) => link.produtoId !== id);
    apiDatabase.productCategories = apiDatabase.productCategories.filter((link) => link.produtoId !== id);
    apiDatabase.products = apiDatabase.products.filter((product) => product.id !== id);
    return HttpResponse.json({ message: `O produto ${id} deletado com sucesso.` });
  }),

  http.get('*/categoria', ({ request }) => {
    const query = queryOf(request);
    return listResponse(
      apiDatabase.categories.filter(
        (category) =>
          matchesNumber(query.get('categoriaId'), category.id) && matchesText(query.get('nome'), category.nome),
      ),
    );
  }),

  http.post<never, NameBody>('*/categoria', async ({ request }) => {
    const { nome } = await request.json();
    if (!nome?.trim()) return springError(400, 'Bad Request', request);
    if (apiDatabase.categories.some((category) => category.nome === nome)) {
      return HttpResponse.text('Já existe uma categoria com esse nome.', { status: 409 });
    }
    const category = { id: apiDatabase.nextId++, nome };
    apiDatabase.categories.push(category);
    return HttpResponse.json(category, { status: 201 });
  }),

  http.put<{ id: string }, NameBody>('*/categoria/:id', async ({ request, params }) => {
    const { nome } = await request.json();
    if (!nome?.trim()) return springError(400, 'Bad Request', request);
    const category = apiDatabase.categories.find((candidate) => candidate.id === Number(params.id));
    if (!category) return springError(404, 'Not Found', request);
    category.nome = nome;
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete('*/categoria/:id', ({ request, params }) => {
    const id = Number(params.id);
    if (!apiDatabase.categories.some((category) => category.id === id)) return springError(404, 'Not Found', request);
    if (apiDatabase.productCategories.some((link) => link.categoriaId === id)) {
      return springError(409, 'Conflict', request);
    }
    apiDatabase.categories = apiDatabase.categories.filter((category) => category.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('*/categoriaproduto', ({ request }) => {
    const query = queryOf(request);
    return listResponse(
      apiDatabase.productCategories.filter(
        (link) =>
          matchesNumber(query.get('produtoId'), link.produtoId) &&
          matchesNumber(query.get('categoriaId'), link.categoriaId),
      ),
    );
  }),

  http.post<never, ProductCategoryRow>('*/categoriaproduto', async ({ request }) => {
    const { produtoId, categoriaId } = await request.json();
    if (
      apiDatabase.productCategories.some((link) => link.produtoId === produtoId && link.categoriaId === categoriaId)
    ) {
      return HttpResponse.text('Este produto já está associado a esta categoria.', { status: 409 });
    }
    const productExists = apiDatabase.products.some((product) => product.id === produtoId);
    const categoryExists = apiDatabase.categories.some((category) => category.id === categoriaId);
    if (!productExists || !categoryExists) {
      return HttpResponse.text('Produto ou categoria inexistente. Verifique os IDs informados.', { status: 409 });
    }
    apiDatabase.productCategories.push({ produtoId, categoriaId });
    return HttpResponse.json({ produtoId, categoriaId }, { status: 201 });
  }),

  http.delete<never, ProductCategoryRow>('*/categoriaproduto', async ({ request }) => {
    const { produtoId, categoriaId } = await request.json();
    const remaining = apiDatabase.productCategories.filter(
      (link) => !(link.produtoId === produtoId && link.categoriaId === categoriaId),
    );
    if (remaining.length === apiDatabase.productCategories.length) {
      return HttpResponse.text('O vínculo entre o produto e a categoria nao existe.', { status: 409 });
    }
    apiDatabase.productCategories = remaining;
    return HttpResponse.json({ mensagem: 'Categoria desassociada do produto com sucesso.' });
  }),

  http.get('*/imagem', ({ request }) => {
    const produtoId = queryOf(request).get('produtoId');
    return listResponse(
      apiDatabase.productImages.filter((productImage) => matchesNumber(produtoId, productImage.produtoId)),
    );
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
    const productImage = { id, produtoId: Number(produtoId), imagemUrl: `${SUPABASE_IMAGES}/upload-${id}` };
    apiDatabase.productImages.push(productImage);
    return HttpResponse.json(productImage, { status: 201 });
  }),

  http.delete<never, ProductImageBody>('*/imagem', async ({ request }) => {
    const { id, produtoId } = await request.json();
    const remaining = apiDatabase.productImages.filter(
      (productImage) => !(productImage.id === id && productImage.produtoId === produtoId),
    );
    if (remaining.length === apiDatabase.productImages.length) {
      return HttpResponse.text('Imagem não encontrada ou não pertence a este produto.', { status: 409 });
    }
    apiDatabase.productImages = remaining;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('*/socialnetwork', ({ request }) => {
    const name = queryOf(request).get('name');
    return listResponse(
      apiDatabase.socialNetworks.filter((socialNetwork) => !name?.trim() || socialNetwork.descricao === name),
    );
  }),

  // Bug da API: o serviço testa `findByName(...) != null` numa List, então todo cadastro e todo
  // PUT com descricao preenchida respondem 409, exista ou não a rede.
  http.post<never, SocialNetworkBody>('*/socialnetwork', async ({ request }) => {
    const { descricao, link } = await request.json();
    if (!descricao?.trim() || !link?.trim()) return springError(400, 'Bad Request', request);
    return HttpResponse.text(SOCIAL_NETWORK_TAKEN, { status: 409 });
  }),

  http.put<{ description: string }, SocialNetworkBody>('*/socialnetwork/:description', async ({ request, params }) => {
    const { descricao, link } = await request.json();
    const socialNetwork = apiDatabase.socialNetworks.find((candidate) => candidate.descricao === params.description);
    if (!socialNetwork) return HttpResponse.text('Descrição não encontrado.', { status: 409 });
    if (descricao?.trim()) return HttpResponse.text(SOCIAL_NETWORK_TAKEN, { status: 409 });
    if (link?.trim()) socialNetwork.link = link;
    return HttpResponse.json(socialNetwork);
  }),

  http.delete<{ description: string }>('*/socialnetwork/:description', ({ request, params }) => {
    const remaining = apiDatabase.socialNetworks.filter(
      (socialNetwork) => socialNetwork.descricao !== params.description,
    );
    if (remaining.length === apiDatabase.socialNetworks.length) return springError(404, 'Not Found', request);
    apiDatabase.socialNetworks = remaining;
    return HttpResponse.json({ message: `Rede social ${params.description} deletada com sucesso.` });
  }),

  http.get('*/canalvenda', ({ request }) => {
    const query = queryOf(request);
    return listResponse(
      apiDatabase.salesChannels.filter(
        (salesChannel) =>
          matchesNumber(query.get('id'), salesChannel.id) && matchesText(query.get('nome'), salesChannel.nome),
      ),
    );
  }),

  http.post<never, NameBody>('*/canalvenda', async ({ request }) => {
    const { nome } = await request.json();
    if (!nome?.trim()) return springError(400, 'Bad Request', request);
    if (apiDatabase.salesChannels.some((salesChannel) => salesChannel.nome === nome)) {
      return HttpResponse.text('Já existe um canal com esse nome', { status: 409 });
    }
    const salesChannel = { id: apiDatabase.nextId++, nome };
    apiDatabase.salesChannels.push(salesChannel);
    return HttpResponse.json(salesChannel, { status: 201 });
  }),

  http.put<{ id: string }, NameBody>('*/canalvenda/:id', async ({ request, params }) => {
    const { nome } = await request.json();
    if (!nome?.trim()) return springError(400, 'Bad Request', request);
    const salesChannel = apiDatabase.salesChannels.find((candidate) => candidate.id === Number(params.id));
    if (!salesChannel) return springError(404, 'Not Found', request);
    salesChannel.nome = nome;
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete('*/canalvenda/:id', ({ request, params }) => {
    const id = Number(params.id);
    if (!apiDatabase.salesChannels.some((salesChannel) => salesChannel.id === id)) {
      return springError(404, 'Not Found', request);
    }
    if (apiDatabase.purchaseLinks.some((link) => link.canalVendaId === id)) {
      return springError(409, 'Conflict', request);
    }
    apiDatabase.salesChannels = apiDatabase.salesChannels.filter((salesChannel) => salesChannel.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('*/canalvendaproduto', ({ request }) => {
    const query = queryOf(request);
    return listResponse(
      apiDatabase.purchaseLinks.filter(
        (link) =>
          matchesNumber(query.get('produtoId'), link.produtoId) &&
          matchesNumber(query.get('canalVendaId'), link.canalVendaId),
      ),
      204,
    );
  }),

  http.post<never, PurchaseLinkRow>('*/canalvendaproduto', async ({ request }) => {
    const { produtoId, canalVendaId, link } = await request.json();
    if (!link?.trim()) return springError(400, 'Bad Request', request);
    if (
      apiDatabase.purchaseLinks.some(
        (candidate) => candidate.produtoId === produtoId && candidate.canalVendaId === canalVendaId,
      )
    ) {
      return HttpResponse.text('Este produto já está associado a este canal de venda.', { status: 409 });
    }
    const productExists = apiDatabase.products.some((product) => product.id === produtoId);
    const salesChannelExists = apiDatabase.salesChannels.some((salesChannel) => salesChannel.id === canalVendaId);
    if (!productExists || !salesChannelExists) {
      return HttpResponse.text('Produto ou canal de venda inexistente. Verifique os IDs informados.', { status: 409 });
    }
    apiDatabase.purchaseLinks.push({ produtoId, canalVendaId, link });
    return HttpResponse.json({ mensagem: 'Canal de venda associado ao produto com sucesso.' }, { status: 201 });
  }),

  http.delete<never, PurchaseLinkRow>('*/canalvendaproduto', async ({ request }) => {
    const { produtoId, canalVendaId, link } = await request.json();
    if (!link?.trim()) return springError(400, 'Bad Request', request);
    const remaining = apiDatabase.purchaseLinks.filter(
      (link) => !(link.produtoId === produtoId && link.canalVendaId === canalVendaId),
    );
    if (remaining.length === apiDatabase.purchaseLinks.length) {
      return HttpResponse.text('O vínculo entre este produto e canal de venda não existe.', { status: 409 });
    }
    apiDatabase.purchaseLinks = remaining;
    return HttpResponse.json({ mensagem: 'Canal de venda desassociado do produto com sucesso.' });
  }),
];
