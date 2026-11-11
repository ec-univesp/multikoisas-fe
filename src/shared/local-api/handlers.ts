import { http, HttpResponse } from 'msw';
import type { ApiDatabase, ProductCategoryRow, PurchaseLinkRow, UserRow } from './database';
import type { ImageStore } from './imageStore';

export type ApiHandlerOptions = {
  onChange: () => boolean;
  images: Pick<ImageStore, 'save' | 'remove'>;
  baseUrl?: string;
  reproduceApiBugs: boolean;
};

// Spring Boot default error body for ResponseStatusException.
const springError = (status: number, error: string, request: Request) =>
  HttpResponse.json(
    { timestamp: new Date().toISOString(), status, error, path: new URL(request.url).pathname },
    { status },
  );

// The API answers an empty list with a bodiless 404; /canalvendaproduto answers 204.
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
type UserBody = Partial<Omit<UserRow, 'id'>> & { password?: string };
type StoreBody = { nomeLoja?: string; descricaoLoja?: string };

const SOCIAL_NETWORK_TAKEN = 'Esta rede social já está cadastrada.';

// Bean Validation messages of the Java UserRequest, typos included.
const USER_FIELD_MESSAGES = {
  email: 'O campo email e obrigatorio',
  username: 'O campo username e obrigatorio',
  password: 'O campo password e obrigatoria',
  role: 'o campo role e obrigatorio',
} as const;

const isBlank = (value: unknown) => typeof value !== 'string' || value.trim() === '';

const blankUserFields = (body: UserBody) => {
  const values = new Map<string, unknown>(Object.entries(body));
  return Object.fromEntries(Object.entries(USER_FIELD_MESSAGES).filter(([field]) => isBlank(values.get(field))));
};

const MAX_UPLOAD_BYTES = 1_048_576;

const PHOTO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

const STORE_IMAGE_FILE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);

const STORE_IMAGE_TYPES = new Set(['LOGO', 'PERFIL', 'CAPA', 'BANNER', 'GALERIA']);

// A host PRODUCT_IMAGE_HOSTS accepts, so the uploads display like the real API ones.
const UPLOADED_IMAGES_URL = 'https://avphmmvnlrbidhjrzozx.supabase.co/storage/v1/object/public/imagem/upload-';

const uploadedImageUrl = (id: number) => `${UPLOADED_IMAGES_URL}${id}`;

const storageFull = () => HttpResponse.text('Espaço do navegador cheio', { status: 507 });

export const createApiHandlers = (
  database: ApiDatabase,
  { onChange, images, baseUrl = '*', reproduceApiBugs }: ApiHandlerOptions,
) => {
  const saved = (response: Response) => (onChange() ? response : storageFull());

  return [
    http.get(`${baseUrl}/produto`, ({ request }) => {
      const id = queryOf(request).get('id');
      return listResponse(database.products.filter((product) => matchesNumber(id, product.id)));
    }),

    http.post<never, ProductBody>(`${baseUrl}/produto`, async ({ request }) => {
      const { nome, descricaoProduto = '' } = await request.json();
      if (!nome?.trim()) return springError(400, 'Bad Request', request);
      const product = { id: database.nextId++, nome, descricaoProduto };
      database.products.push(product);
      return saved(HttpResponse.json(product, { status: 201 }));
    }),

    http.put<{ id: string }, ProductBody>(`${baseUrl}/produto/:id`, async ({ request, params }) => {
      const { nome, descricaoProduto = '' } = await request.json();
      if (!nome?.trim()) return springError(400, 'Bad Request', request);
      const product = database.products.find((candidate) => candidate.id === Number(params.id));
      if (!product) return springError(404, 'Not Found', request);
      Object.assign(product, { nome, descricaoProduto });
      return saved(HttpResponse.json(product));
    }),

    // The API deletes photos, links and categories along; without a purchase link or a category it rolls back and answers 409.
    http.delete(`${baseUrl}/produto/:id`, async ({ request, params }) => {
      const id = Number(params.id);
      const hasPurchaseLink = database.purchaseLinks.some((link) => link.produtoId === id);
      const hasCategory = database.productCategories.some((link) => link.produtoId === id);
      if (reproduceApiBugs && !hasPurchaseLink) {
        return HttpResponse.text('Nao existe vinculo com o produto.', { status: 409 });
      }
      if (reproduceApiBugs && !hasCategory) {
        return HttpResponse.text('Nao existe vínculo com esse produto.', { status: 409 });
      }
      if (!database.products.some((product) => product.id === id)) return springError(404, 'Not Found', request);
      const localPhotoIds = database.productImages
        .filter((productImage) => productImage.produtoId === id && productImage.imagemUrl.startsWith(UPLOADED_IMAGES_URL))
        .map((productImage) => productImage.id);
      database.productImages = database.productImages.filter((productImage) => productImage.produtoId !== id);
      database.purchaseLinks = database.purchaseLinks.filter((link) => link.produtoId !== id);
      database.productCategories = database.productCategories.filter((link) => link.produtoId !== id);
      database.products = database.products.filter((product) => product.id !== id);
      const response = saved(HttpResponse.json({ message: `O produto ${id} deletado com sucesso.` }));
      if (response.ok) await Promise.allSettled(localPhotoIds.map((photoId) => images.remove(photoId)));
      return response;
    }),

    http.get(`${baseUrl}/categoria`, ({ request }) => {
      const query = queryOf(request);
      return listResponse(
        database.categories.filter(
          (category) =>
            matchesNumber(query.get('categoriaId'), category.id) && matchesText(query.get('nome'), category.nome),
        ),
      );
    }),

    http.post<never, NameBody>(`${baseUrl}/categoria`, async ({ request }) => {
      const { nome } = await request.json();
      if (!nome?.trim()) return springError(400, 'Bad Request', request);
      if (database.categories.some((category) => category.nome === nome)) {
        return HttpResponse.text('Já existe uma categoria com esse nome.', { status: 409 });
      }
      const category = { id: database.nextId++, nome };
      database.categories.push(category);
      return saved(HttpResponse.json(category, { status: 201 }));
    }),

    http.put<{ id: string }, NameBody>(`${baseUrl}/categoria/:id`, async ({ request, params }) => {
      const { nome } = await request.json();
      if (!nome?.trim()) return springError(400, 'Bad Request', request);
      const category = database.categories.find((candidate) => candidate.id === Number(params.id));
      if (!category) return springError(404, 'Not Found', request);
      category.nome = nome;
      return saved(new HttpResponse(null, { status: 204 }));
    }),

    http.delete(`${baseUrl}/categoria/:id`, ({ request, params }) => {
      const id = Number(params.id);
      if (!database.categories.some((category) => category.id === id)) return springError(404, 'Not Found', request);
      if (database.productCategories.some((link) => link.categoriaId === id)) {
        return springError(409, 'Conflict', request);
      }
      database.categories = database.categories.filter((category) => category.id !== id);
      return saved(new HttpResponse(null, { status: 204 }));
    }),

    http.get(`${baseUrl}/categoriaproduto`, ({ request }) => {
      const query = queryOf(request);
      return listResponse(
        database.productCategories.filter(
          (link) =>
            matchesNumber(query.get('produtoId'), link.produtoId) &&
            matchesNumber(query.get('categoriaId'), link.categoriaId),
        ),
      );
    }),

    http.post<never, ProductCategoryRow>(`${baseUrl}/categoriaproduto`, async ({ request }) => {
      const { produtoId, categoriaId } = await request.json();
      if (database.productCategories.some((link) => link.produtoId === produtoId && link.categoriaId === categoriaId)) {
        return HttpResponse.text('Este produto já está associado a esta categoria.', { status: 409 });
      }
      const productExists = database.products.some((product) => product.id === produtoId);
      const categoryExists = database.categories.some((category) => category.id === categoriaId);
      if (!productExists || !categoryExists) {
        return HttpResponse.text('Produto ou categoria inexistente. Verifique os IDs informados.', { status: 409 });
      }
      database.productCategories.push({ produtoId, categoriaId });
      return saved(HttpResponse.json({ produtoId, categoriaId }, { status: 201 }));
    }),

    http.delete<never, ProductCategoryRow>(`${baseUrl}/categoriaproduto`, async ({ request }) => {
      const { produtoId, categoriaId } = await request.json();
      const remaining = database.productCategories.filter(
        (link) => !(link.produtoId === produtoId && link.categoriaId === categoriaId),
      );
      if (remaining.length === database.productCategories.length) {
        return HttpResponse.text('O vínculo entre o produto e a categoria nao existe.', { status: 409 });
      }
      database.productCategories = remaining;
      return saved(HttpResponse.json({ mensagem: 'Categoria desassociada do produto com sucesso.' }));
    }),

    http.get(`${baseUrl}/imagem`, ({ request }) => {
      const produtoId = queryOf(request).get('produtoId');
      return listResponse(
        database.productImages.filter((productImage) => matchesNumber(produtoId, productImage.produtoId)),
      );
    }),

    http.post(`${baseUrl}/imagem`, async ({ request }) => {
      const produtoId = queryOf(request).get('produtoId');
      if (produtoId === null) return springError(400, 'Bad Request', request);
      const form = await request.formData();
      const file = form.get('file');
      if (file === null || typeof file === 'string') return springError(400, 'Bad Request', request);
      if (file.size === 0) return HttpResponse.text('O arquivo enviado está vazio.', { status: 409 });
      if (file.size > MAX_UPLOAD_BYTES) return springError(413, 'Payload Too Large', request);
      if (!PHOTO_TYPES.has(file.type)) return springError(415, 'Unsupported Media Type', request);
      const id = database.nextId++;
      await images.save(id, file);
      const productImage = { id, produtoId: Number(produtoId), imagemUrl: uploadedImageUrl(id) };
      database.productImages.push(productImage);
      if (!onChange()) {
        database.productImages.pop();
        await images.remove(id);
        return storageFull();
      }
      return HttpResponse.json(productImage, { status: 201 });
    }),

    http.delete<never, ProductImageBody>(`${baseUrl}/imagem`, async ({ request }) => {
      const { id, produtoId } = await request.json();
      const remaining = database.productImages.filter(
        (productImage) => !(productImage.id === id && productImage.produtoId === produtoId),
      );
      if (id === undefined || remaining.length === database.productImages.length) {
        return HttpResponse.text('Imagem não encontrada ou não pertence a este produto.', { status: 409 });
      }
      await images.remove(id);
      database.productImages = remaining;
      return saved(new HttpResponse(null, { status: 204 }));
    }),

    http.get(`${baseUrl}/socialnetwork`, ({ request }) => {
      const name = queryOf(request).get('name');
      return listResponse(
        database.socialNetworks.filter((socialNetwork) => !name?.trim() || socialNetwork.descricao === name),
      );
    }),

    // API bug: the service checks `findByName(...) != null` on a List, so every create and every
    // PUT with descricao filled answer 409, whether the network exists or not.
    http.post<never, SocialNetworkBody>(`${baseUrl}/socialnetwork`, async ({ request }) => {
      const { descricao, link } = await request.json();
      if (!descricao?.trim() || !link?.trim()) return springError(400, 'Bad Request', request);
      const isTaken = database.socialNetworks.some((socialNetwork) => socialNetwork.descricao === descricao);
      if (reproduceApiBugs || isTaken) return HttpResponse.text(SOCIAL_NETWORK_TAKEN, { status: 409 });
      const socialNetwork = { id: database.nextId++, descricao, link };
      database.socialNetworks.push(socialNetwork);
      return saved(HttpResponse.json(socialNetwork, { status: 201 }));
    }),

    http.put<{ description: string }, SocialNetworkBody>(
      `${baseUrl}/socialnetwork/:description`,
      async ({ request, params }) => {
        const { descricao, link } = await request.json();
        const socialNetwork = database.socialNetworks.find((candidate) => candidate.descricao === params.description);
        if (!socialNetwork) return HttpResponse.text('Descrição não encontrado.', { status: 409 });
        const isTakenByAnother = database.socialNetworks.some(
          (candidate) => candidate !== socialNetwork && candidate.descricao === descricao,
        );
        if (descricao?.trim() && (reproduceApiBugs || isTakenByAnother)) {
          return HttpResponse.text(SOCIAL_NETWORK_TAKEN, { status: 409 });
        }
        if (descricao?.trim()) socialNetwork.descricao = descricao;
        if (link?.trim()) socialNetwork.link = link;
        return saved(HttpResponse.json(socialNetwork));
      },
    ),

    http.delete<{ description: string }>(`${baseUrl}/socialnetwork/:description`, ({ request, params }) => {
      const remaining = database.socialNetworks.filter(
        (socialNetwork) => socialNetwork.descricao !== params.description,
      );
      if (remaining.length === database.socialNetworks.length) return springError(404, 'Not Found', request);
      database.socialNetworks = remaining;
      return saved(HttpResponse.json({ message: `Rede social ${params.description} deletada com sucesso.` }));
    }),

    http.get(`${baseUrl}/user`, ({ request }) => {
      const query = queryOf(request);
      const id = query.get('id');
      const username = query.get('username');
      return listResponse(
        database.users.filter((user) =>
          id !== null ? user.id === Number(id) : !username?.trim() || user.username === username,
        ),
      );
    }),

    http.post<never, UserBody>(`${baseUrl}/user`, async ({ request }) => {
      const body = await request.json();
      const blankFields = blankUserFields(body);
      if (Object.keys(blankFields).length > 0) return HttpResponse.json(blankFields, { status: 400 });
      const { username = '', email = '', role = '' } = body;
      if (database.users.some((user) => user.username === username)) {
        return HttpResponse.text('Este nome de usuário já está em uso.', { status: 409 });
      }
      if (database.users.some((user) => user.email === email)) {
        return HttpResponse.text('Já existe um usuário cadastrado com este e-mail.', { status: 409 });
      }
      database.users.push({ id: database.nextId++, username, email, role });
      return saved(HttpResponse.text('usuario cadastrado com sucesso', { status: 201 }));
    }),

    // API bug: the Java PUT never copies the role nor checks the e-mail of the other users.
    http.put<{ username: string }, UserBody>(`${baseUrl}/user/:username`, async ({ request, params }) => {
      const { email, role } = await request.json();
      const user = database.users.find((candidate) => candidate.username === params.username);
      if (!user) return HttpResponse.text('Usuário não encontrado.', { status: 409 });
      const isTakenByAnother = database.users.some((candidate) => candidate !== user && candidate.email === email);
      if (!reproduceApiBugs && isTakenByAnother) {
        return HttpResponse.text('Este e-mail já está em uso por outra conta.', { status: 409 });
      }
      if (email?.trim()) user.email = email;
      if (!reproduceApiBugs && role?.trim()) user.role = role;
      return saved(HttpResponse.json(user));
    }),

    http.delete<{ username: string }>(`${baseUrl}/user/:username`, ({ params }) => {
      const remaining = database.users.filter((user) => user.username !== params.username);
      if (remaining.length === database.users.length) return new HttpResponse(null, { status: 404 });
      database.users = remaining;
      return saved(HttpResponse.json({ message: `Usuario ${params.username} deletado com sucesso.` }));
    }),

    http.get(`${baseUrl}/canalvenda`, ({ request }) => {
      const query = queryOf(request);
      return listResponse(
        database.salesChannels.filter(
          (salesChannel) =>
            matchesNumber(query.get('id'), salesChannel.id) && matchesText(query.get('nome'), salesChannel.nome),
        ),
      );
    }),

    http.post<never, NameBody>(`${baseUrl}/canalvenda`, async ({ request }) => {
      const { nome } = await request.json();
      if (!nome?.trim()) return springError(400, 'Bad Request', request);
      if (database.salesChannels.some((salesChannel) => salesChannel.nome === nome)) {
        return HttpResponse.text('Já existe um canal com esse nome', { status: 409 });
      }
      const salesChannel = { id: database.nextId++, nome };
      database.salesChannels.push(salesChannel);
      return saved(HttpResponse.json(salesChannel, { status: 201 }));
    }),

    http.put<{ id: string }, NameBody>(`${baseUrl}/canalvenda/:id`, async ({ request, params }) => {
      const { nome } = await request.json();
      if (!nome?.trim()) return springError(400, 'Bad Request', request);
      const salesChannel = database.salesChannels.find((candidate) => candidate.id === Number(params.id));
      if (!salesChannel) return springError(404, 'Not Found', request);
      salesChannel.nome = nome;
      return saved(new HttpResponse(null, { status: 204 }));
    }),

    http.delete(`${baseUrl}/canalvenda/:id`, ({ request, params }) => {
      const id = Number(params.id);
      if (!database.salesChannels.some((salesChannel) => salesChannel.id === id)) {
        return springError(404, 'Not Found', request);
      }
      if (database.purchaseLinks.some((link) => link.canalVendaId === id)) {
        return springError(409, 'Conflict', request);
      }
      database.salesChannels = database.salesChannels.filter((salesChannel) => salesChannel.id !== id);
      return saved(new HttpResponse(null, { status: 204 }));
    }),

    http.get(`${baseUrl}/canalvendaproduto`, ({ request }) => {
      const query = queryOf(request);
      return listResponse(
        database.purchaseLinks.filter(
          (link) =>
            matchesNumber(query.get('produtoId'), link.produtoId) &&
            matchesNumber(query.get('canalVendaId'), link.canalVendaId),
        ),
        204,
      );
    }),

    http.post<never, PurchaseLinkRow>(`${baseUrl}/canalvendaproduto`, async ({ request }) => {
      const { produtoId, canalVendaId, link } = await request.json();
      if (!link?.trim()) return springError(400, 'Bad Request', request);
      if (
        database.purchaseLinks.some(
          (candidate) => candidate.produtoId === produtoId && candidate.canalVendaId === canalVendaId,
        )
      ) {
        return HttpResponse.text('Este produto já está associado a este canal de venda.', { status: 409 });
      }
      const productExists = database.products.some((product) => product.id === produtoId);
      const salesChannelExists = database.salesChannels.some((salesChannel) => salesChannel.id === canalVendaId);
      if (!productExists || !salesChannelExists) {
        return HttpResponse.text('Produto ou canal de venda inexistente. Verifique os IDs informados.', {
          status: 409,
        });
      }
      database.purchaseLinks.push({ produtoId, canalVendaId, link });
      return saved(
        HttpResponse.json({ mensagem: 'Canal de venda associado ao produto com sucesso.' }, { status: 201 }),
      );
    }),

    http.put<never, Pick<PurchaseLinkRow, 'link'>>(`${baseUrl}/canalvendaproduto`, async ({ request }) => {
      const query = queryOf(request);
      const { link } = await request.json();
      if (!link?.trim()) return springError(400, 'Bad Request', request);
      const purchaseLink = database.purchaseLinks.find(
        (candidate) =>
          candidate.produtoId === Number(query.get('produtoId')) &&
          candidate.canalVendaId === Number(query.get('canalVendaId')),
      );
      if (!purchaseLink) return springError(404, 'Not Found', request);
      purchaseLink.link = link;
      return saved(HttpResponse.json({ mensagem: 'Link do canal de venda atualizado com sucesso.' }));
    }),

    http.delete<never, PurchaseLinkRow>(`${baseUrl}/canalvendaproduto`, async ({ request }) => {
      const { produtoId, canalVendaId, link } = await request.json();
      if (!link?.trim()) return springError(400, 'Bad Request', request);
      const remaining = database.purchaseLinks.filter(
        (link) => !(link.produtoId === produtoId && link.canalVendaId === canalVendaId),
      );
      if (remaining.length === database.purchaseLinks.length) {
        return HttpResponse.text('O vínculo entre este produto e canal de venda não existe.', { status: 409 });
      }
      database.purchaseLinks = remaining;
      return saved(HttpResponse.json({ mensagem: 'Canal de venda desassociado do produto com sucesso.' }));
    }),

    http.get(`${baseUrl}/loja`, ({ request }) => {
      const name = queryOf(request).get('nome');
      return listResponse(database.stores.filter((store) => matchesText(name, store.nomeLoja)));
    }),

    http.post<never, StoreBody>(`${baseUrl}/loja`, async ({ request }) => {
      const { nomeLoja, descricaoLoja = '' } = await request.json();
      if (!nomeLoja?.trim()) return springError(400, 'Bad Request', request);
      if (database.stores.some((store) => matchesText(nomeLoja, store.nomeLoja))) {
        return springError(409, 'Conflict', request);
      }
      const store = { id: database.nextId++, nomeLoja, descricaoLoja };
      database.stores.push(store);
      if (onChange()) return HttpResponse.json(store, { status: 201 });
      database.stores.pop();
      return storageFull();
    }),

    http.put<{ name: string }, StoreBody>(`${baseUrl}/loja/:name`, async ({ request, params }) => {
      const { descricaoLoja = '' } = await request.json();
      const store = database.stores.find((candidate) => matchesText(params.name, candidate.nomeLoja));
      if (!store) return springError(404, 'Not Found', request);
      const previousDescription = store.descricaoLoja;
      store.descricaoLoja = descricaoLoja;
      if (onChange()) return HttpResponse.json(store);
      store.descricaoLoja = previousDescription;
      return storageFull();
    }),

    http.get(`${baseUrl}/imagemloja`, ({ request }) => {
      const query = queryOf(request);
      const storeImages = database.storeImages.filter(
        (storeImage) =>
          matchesText(query.get('tipo'), storeImage.tipo) && matchesNumber(query.get('id'), storeImage.id),
      );
      if (storeImages.length === 0) {
        return HttpResponse.json({ message: 'Nenhuma imagem encontrada.' }, { status: 404 });
      }
      return HttpResponse.json(storeImages);
    }),

    http.post(`${baseUrl}/imagemloja`, async ({ request }) => {
      const tipo = queryOf(request).get('tipo') ?? '';
      if (!STORE_IMAGE_TYPES.has(tipo)) return springError(400, 'Bad Request', request);
      const file = (await request.formData()).get('file');
      if (file === null || typeof file === 'string' || file.size === 0) return springError(400, 'Bad Request', request);
      if (file.size > MAX_UPLOAD_BYTES) return springError(413, 'Payload Too Large', request);
      if (!STORE_IMAGE_FILE_TYPES.has(file.type)) return springError(415, 'Unsupported Media Type', request);
      const id = database.nextId++;
      await images.save(id, file);
      const storeImage = { id, imagemUrl: uploadedImageUrl(id), tipo };
      database.storeImages.push(storeImage);
      if (onChange()) return HttpResponse.json(storeImage, { status: 201 });
      database.storeImages.pop();
      await images.remove(id);
      return storageFull();
    }),

    http.delete<{ type: string }>(`${baseUrl}/imagemloja/:type`, async ({ request, params }) => {
      const id = Number(queryOf(request).get('id'));
      const remaining = database.storeImages.filter(
        (storeImage) => !(storeImage.id === id && storeImage.tipo === params.type),
      );
      if (remaining.length === database.storeImages.length) return springError(404, 'Not Found', request);
      database.storeImages = remaining;
      await images.remove(id);
      return saved(HttpResponse.json({ message: 'Imagem deletada com sucesso.' }));
    }),
  ];
};
