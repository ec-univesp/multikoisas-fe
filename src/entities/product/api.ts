import { type FetchOptions, getFromApi } from '@/shared/api/getFromApi';
import { toDisplayableImageUrl } from './imageUrl';
import { toBaseSlug } from './toBaseSlug';
import { STORE_PRESENTATION, type Category, type Product, type StoreLink, type StoreSlug } from './types';

export type ProdutoResponse = { id: number; nome: string; descricaoProduto: string };
type CategoriaResponse = { id: number; nome: string };
type CategoriaProdutoResponse = { produtoId: number; categoriaId: number };
export type ImagemResponse = { id: number; produtoId: number; imagemUrl: string };
export type ProductImageRecord = { id: number; url: string | null };
type CanalVendaResponse = { id: number; nome: string };
type CanalVendaProdutoResponse = { produtoId: number; canalVendaId: number; link: string };
type Catalog = { products: Product[]; categories: Category[] };

const UNCATEGORIZED = 'Sem categoria';

const firstNonEmptyLine = (text: string): string =>
  text.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim() ?? '';

export const toImageRecord = (imagem: ImagemResponse): ProductImageRecord => ({
  id: imagem.id,
  url: toDisplayableImageUrl(imagem.imagemUrl),
});

export const toImageUrlsInIdOrder = (records: readonly ProductImageRecord[]): string[] =>
  [...records]
    .sort((first, second) => first.id - second.id)
    .flatMap((record) => (record.url === null ? [] : [record.url]));

const toImageRecords = (imagens: readonly ImagemResponse[]): ProductImageRecord[] =>
  [...imagens].sort((first, second) => first.id - second.id).map(toImageRecord);

const toImageUrls = (imagens: readonly ImagemResponse[]): string[] => toImageUrlsInIdOrder(imagens.map(toImageRecord));

const isStoreSlug = (slug: string): slug is StoreSlug => Object.hasOwn(STORE_PRESENTATION, slug);

// ponytail: canal sem apresentação em STORE_PRESENTATION (Instagram, TikTok) não vira botão de compra.
const toStoreLinks = (
  vinculos: readonly CanalVendaProdutoResponse[],
  canaisVenda: readonly CanalVendaResponse[],
): StoreLink[] =>
  vinculos
    .flatMap((vinculo) => {
      const canalVenda = canaisVenda.find((candidate) => candidate.id === vinculo.canalVendaId);
      const store = canalVenda ? toBaseSlug(canalVenda.nome) : '';
      return isStoreSlug(store) && vinculo.link ? [{ store, url: vinculo.link }] : [];
    })
    .filter(
      (storeLink, position, storeLinks) => storeLinks.findIndex(({ store }) => store === storeLink.store) === position,
    );

export const toProduct = (
  produto: ProdutoResponse,
  category: Category | undefined,
  images: string[] = [],
  storeLinks: StoreLink[] = [],
): Product => ({
  id: produto.id,
  slug: `${toBaseSlug(produto.nome)}-${produto.id}`,
  name: produto.nome,
  category: category?.name ?? UNCATEGORIZED,
  categoryId: category?.id ?? null,
  shortDescription: firstNonEmptyLine(produto.descricaoProduto),
  longDescription: produto.descricaoProduto.trim(),
  images,
  storeLinks,
});

export const fetchCategories = async (options: FetchOptions = {}): Promise<Category[]> =>
  (await getFromApi<CategoriaResponse[]>('/categoria', options)).map((categoria) => ({
    id: categoria.id,
    name: categoria.nome,
  }));

export const fetchProductImageRecords = async (
  produtoId: number,
  options: FetchOptions = {},
): Promise<ProductImageRecord[]> =>
  toImageRecords(await getFromApi<ImagemResponse[]>(`/imagem/${produtoId}`, options));

export const fetchCatalog = async (options: FetchOptions = {}): Promise<Catalog> => {
  const [produtos, categories, vinculos, imagens, canaisVenda, linksDeCompra] = await Promise.all([
    getFromApi<ProdutoResponse[]>('/produto', options),
    fetchCategories(options),
    getFromApi<CategoriaProdutoResponse[]>('/categoriaproduto', options),
    // Foto e link de compra são acessórios: sem eles a vitrine segue no ar.
    getFromApi<ImagemResponse[]>('/imagem', options).catch((): ImagemResponse[] => []),
    getFromApi<CanalVendaResponse[]>('/canalvenda', options).catch((): CanalVendaResponse[] => []),
    getFromApi<CanalVendaProdutoResponse[]>('/canalvendaproduto', options).catch(
      (): CanalVendaProdutoResponse[] => [],
    ),
  ]);
  const categoryOf = (produtoId: number): Category | undefined => {
    const vinculo = vinculos.find((candidate) => candidate.produtoId === produtoId);
    return categories.find((category) => category.id === vinculo?.categoriaId);
  };
  const imagesOf = (produtoId: number): string[] =>
    toImageUrls(imagens.filter((imagem) => imagem.produtoId === produtoId));
  const storeLinksOf = (produtoId: number): StoreLink[] =>
    toStoreLinks(
      linksDeCompra.filter((vinculo) => vinculo.produtoId === produtoId),
      canaisVenda,
    );
  return {
    products: produtos.map((produto) =>
      toProduct(produto, categoryOf(produto.id), imagesOf(produto.id), storeLinksOf(produto.id)),
    ),
    categories,
  };
};

export const fetchProducts = async (options: FetchOptions = {}): Promise<Product[]> =>
  (await fetchCatalog(options)).products;

export const fetchProductBySlug = async (slug: string): Promise<Product | undefined> =>
  (await fetchProducts()).find((product) => product.slug === slug);
