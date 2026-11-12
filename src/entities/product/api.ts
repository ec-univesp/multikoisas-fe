import { getFromApi } from '@/shared/api/getFromApi';
import { toDisplayableImageUrl } from '@/shared/api/imageUrl';
import { toBaseSlug } from './toBaseSlug';
import { STORE_PRESENTATION, type Category, type Product, type StoreLink, type StoreSlug } from './types';

export type ApiProduct = { id: number; nome: string; descricaoProduto: string };
type ApiCategory = { id: number; nome: string };
type ApiProductCategory = { produtoId: number; categoriaId: number };
export type ApiProductImage = { id: number; produtoId: number; imagemUrl: string };
export type ProductImageRecord = { id: number; url: string | null };
type ApiSalesChannel = { id: number; nome: string };
export type ApiPurchaseLink = { produtoId: number; canalVendaId: number; link: string };
export type Catalog = { products: Product[]; categories: Category[]; salesChannels: { id: number; name: string }[] };

const firstNonEmptyLine = (text: string): string =>
  text
    .split(/\r?\n/)
    .find((line) => line.trim().length > 0)
    ?.trim() ?? '';

export const toImageRecord = (apiImage: ApiProductImage): ProductImageRecord => ({
  id: apiImage.id,
  url: toDisplayableImageUrl(apiImage.imagemUrl),
});

export const toImageUrlsInIdOrder = (records: readonly ProductImageRecord[]): string[] =>
  [...records]
    .sort((first, second) => first.id - second.id)
    .flatMap((record) => (record.url === null ? [] : [record.url]));

const toImageRecords = (apiImages: readonly ApiProductImage[]): ProductImageRecord[] =>
  [...apiImages].sort((first, second) => first.id - second.id).map(toImageRecord);

const toImageUrls = (apiImages: readonly ApiProductImage[]): string[] =>
  toImageUrlsInIdOrder(apiImages.map(toImageRecord));

const isStoreSlug = (slug: string): slug is StoreSlug => Object.hasOwn(STORE_PRESENTATION, slug);

// Full store names the owner may give a sales channel in the panel.
const STORE_NAME_ALIASES: Record<string, StoreSlug> = {
  'magazine-luiza': 'magalu',
  mercadolivre: 'mercado-livre',
  'ali-express': 'aliexpress',
};

export const toStoreSlug = (channelName: string): StoreSlug | null => {
  const slug = toBaseSlug(channelName);
  const store = STORE_NAME_ALIASES[slug] ?? slug;
  return isStoreSlug(store) ? store : null;
};

export const isStoreChannelName = (name: string): boolean => toStoreSlug(name) !== null;

// ponytail: a channel without an entry in STORE_PRESENTATION (Instagram, TikTok) does not become a purchase button.
export const toStoreLinks = (
  apiPurchaseLinks: readonly ApiPurchaseLink[],
  apiSalesChannels: readonly ApiSalesChannel[],
): StoreLink[] =>
  apiPurchaseLinks
    .flatMap((apiPurchaseLink) => {
      const apiSalesChannel = apiSalesChannels.find((candidate) => candidate.id === apiPurchaseLink.canalVendaId);
      const store = apiSalesChannel ? toStoreSlug(apiSalesChannel.nome) : null;
      return store && apiPurchaseLink.link ? [{ store, url: apiPurchaseLink.link }] : [];
    })
    .filter(
      (storeLink, position, storeLinks) => storeLinks.findIndex(({ store }) => store === storeLink.store) === position,
    );

export const toLinkedCategories = (
  apiProductCategories: readonly ApiProductCategory[],
  categories: readonly Category[],
): Category[] =>
  apiProductCategories.flatMap((apiProductCategory) =>
    categories.filter((category) => category.id === apiProductCategory.categoriaId),
  );

export const toProduct = (
  apiProduct: ApiProduct,
  categories: Category[],
  images: string[] = [],
  storeLinks: StoreLink[] = [],
): Product => ({
  id: apiProduct.id,
  slug: `${toBaseSlug(apiProduct.nome)}-${apiProduct.id}`,
  name: apiProduct.nome,
  categories,
  shortDescription: firstNonEmptyLine(apiProduct.descricaoProduto),
  longDescription: apiProduct.descricaoProduto.trim(),
  images,
  storeLinks,
});

export const fetchCategories = async (): Promise<Category[]> =>
  (await getFromApi<ApiCategory>('/categoria')).map((apiCategory) => ({
    id: apiCategory.id,
    name: apiCategory.nome,
  }));

export const fetchProductImageRecords = async (produtoId: number): Promise<ProductImageRecord[]> =>
  toImageRecords(await getFromApi<ApiProductImage>(`/imagem?produtoId=${produtoId}`));

export const fetchCatalog = async (): Promise<Catalog> => {
  const [apiProducts, categories, apiProductCategories, apiImages, apiSalesChannels, apiPurchaseLinks] =
    await Promise.all([
      getFromApi<ApiProduct>('/produto'),
      fetchCategories(),
      getFromApi<ApiProductCategory>('/categoriaproduto'),
      // Photos and purchase links are optional: without them the showcase stays up.
      getFromApi<ApiProductImage>('/imagem').catch((): ApiProductImage[] => []),
      getFromApi<ApiSalesChannel>('/canalvenda').catch((): ApiSalesChannel[] => []),
      getFromApi<ApiPurchaseLink>('/canalvendaproduto').catch((): ApiPurchaseLink[] => []),
    ]);
  const categoriesOf = (produtoId: number): Category[] =>
    toLinkedCategories(
      apiProductCategories.filter((apiProductCategory) => apiProductCategory.produtoId === produtoId),
      categories,
    );
  const imagesOf = (produtoId: number): string[] =>
    toImageUrls(apiImages.filter((apiImage) => apiImage.produtoId === produtoId));
  const storeLinksOf = (produtoId: number): StoreLink[] =>
    toStoreLinks(
      apiPurchaseLinks.filter((apiPurchaseLink) => apiPurchaseLink.produtoId === produtoId),
      apiSalesChannels,
    );
  return {
    products: apiProducts.map((apiProduct) =>
      toProduct(apiProduct, categoriesOf(apiProduct.id), imagesOf(apiProduct.id), storeLinksOf(apiProduct.id)),
    ),
    categories,
    salesChannels: apiSalesChannels.map((apiSalesChannel) => ({ id: apiSalesChannel.id, name: apiSalesChannel.nome })),
  };
};

export const fetchProducts = async (): Promise<Product[]> => (await fetchCatalog()).products;
