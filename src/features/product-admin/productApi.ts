import {
  fetchProductImageRecords,
  toImageRecord,
  toImageUrlsInIdOrder,
  toLinkedCategories,
  toProduct,
  toStoreLinks,
  type ApiPurchaseLink,
  type Category,
  type ApiProductImage,
  type Product,
  type ProductImageRecord,
  type ApiProduct,
} from '@/entities/product';
import { getFromApi } from '@/shared/api/getFromApi';
import type { SalesChannel } from '@/entities/sales-channel';
import type { PhotoChanges, ProductFormValues, PurchaseLink } from './types';

type ProductCategoryBody = { produtoId: number; categoriaId: number };

const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;

const toRequestBody = (body: unknown): RequestInit => {
  if (body === undefined) return {};
  if (body instanceof FormData) return { body };
  return { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
};

const callApi = async (method: string, path: string, body?: unknown): Promise<Response> => {
  const response = await fetch(`/api${path}`, { method, ...toRequestBody(body) });
  if (!response.ok) throw new Error(`${method} ${path} responded ${response.status}`);
  return response;
};

const toProductRequest = (values: ProductFormValues) => ({
  nome: values.name.trim(),
  descricaoProduto: values.description.trim(),
});

const linkCategory = (produtoId: number, categoriaId: number) =>
  callApi('POST', '/categoriaproduto', { produtoId, categoriaId } satisfies ProductCategoryBody);

const unlinkCategory = (produtoId: number, categoriaId: number) =>
  callApi('DELETE', '/categoriaproduto', { produtoId, categoriaId } satisfies ProductCategoryBody);

const fetchCategoryLinks = (produtoId: number): Promise<ProductCategoryBody[]> =>
  getFromApi<ProductCategoryBody>(`/categoriaproduto?produtoId=${produtoId}`);

const toApiPurchaseLink = (produtoId: number, link: PurchaseLink): ApiPurchaseLink => ({
  produtoId,
  canalVendaId: link.salesChannelId,
  link: link.url,
});

export type EditableProduct = {
  product: Product;
  photos: ProductImageRecord[] | null;
  purchaseLinks: PurchaseLink[];
};

const fetchPurchaseLinks = async (produtoId: number): Promise<PurchaseLink[]> =>
  (await getFromApi<ApiPurchaseLink>(`/canalvendaproduto?produtoId=${produtoId}`)).map((apiPurchaseLink) => ({
    salesChannelId: apiPurchaseLink.canalVendaId,
    url: apiPurchaseLink.link,
  }));

const toStoreLinksOf = (
  produtoId: number,
  purchaseLinks: readonly PurchaseLink[],
  salesChannels: readonly SalesChannel[],
) =>
  toStoreLinks(
    purchaseLinks.map((link) => toApiPurchaseLink(produtoId, link)),
    salesChannels.map((salesChannel) => ({ id: salesChannel.id, nome: salesChannel.name })),
  );

export const loadProductForEdit = async (
  product: Product,
  categories: readonly Category[],
  salesChannels: readonly SalesChannel[],
): Promise<EditableProduct | null> => {
  const productId = product.id;
  const [apiProduct] = await getFromApi<ApiProduct>(`/produto?id=${productId}`);
  if (!apiProduct) return null;
  const [categoryLinks, photos, purchaseLinks] = await Promise.all([
    fetchCategoryLinks(productId),
    fetchProductImageRecords(productId).catch(() => null),
    fetchPurchaseLinks(productId),
  ]);
  return {
    product: toProduct(
      apiProduct,
      toLinkedCategories(categoryLinks, categories),
      photos ? toImageUrlsInIdOrder(photos) : product.images,
      salesChannels.length > 0 ? toStoreLinksOf(productId, purchaseLinks, salesChannels) : product.storeLinks,
    ),
    photos,
    purchaseLinks,
  };
};

export class CategoryLinkError extends Error {
  constructor(readonly product: Product) {
    super(`Category links of product ${product.id} were not all saved`);
  }
}

const sameCategoryIn = (categories: readonly Category[], category: Category) =>
  categories.some((candidate) => candidate.id === category.id);

const syncCategoryLinks = async (product: Product, desiredCategories: readonly Category[]): Promise<Product> => {
  let linkedCategories = [...product.categories];
  try {
    for (const category of product.categories.filter((current) => !sameCategoryIn(desiredCategories, current))) {
      await unlinkCategory(product.id, category.id);
      linkedCategories = linkedCategories.filter((linked) => linked.id !== category.id);
    }
    for (const category of desiredCategories.filter((desired) => !sameCategoryIn(product.categories, desired))) {
      await linkCategory(product.id, category.id);
      linkedCategories.push(category);
    }
  } catch {
    throw new CategoryLinkError({ ...product, categories: linkedCategories });
  }
  return { ...product, categories: linkedCategories };
};

const findCategories = (categories: readonly Category[], values: ProductFormValues) =>
  categories.filter((category) => values.categoryIds.includes(String(category.id)));

export const createProduct = async (values: ProductFormValues, categories: readonly Category[]): Promise<Product> => {
  const apiProduct: ApiProduct = await (await callApi('POST', '/produto', toProductRequest(values))).json();
  return syncCategoryLinks(toProduct(apiProduct, []), findCategories(categories, values));
};

export const updateProduct = async (
  product: Product,
  values: ProductFormValues,
  categories: readonly Category[],
): Promise<Product> => {
  const productRequest = toProductRequest(values);
  await callApi('PUT', `/produto/${product.id}`, productRequest);
  const apiProduct = { id: product.id, ...productRequest };
  return syncCategoryLinks(
    toProduct(apiProduct, product.categories, product.images, product.storeLinks),
    findCategories(categories, values),
  );
};

// The API deletes categories, links and photos along, but answers 409 when the category or purchase link is missing.
export class ProductDeleteRefusedError extends Error {}

export const deleteProduct = async (product: Product): Promise<void> => {
  const response = await fetch(`/api/produto/${product.id}`, { method: 'DELETE' });
  if (response.status === HTTP_CONFLICT)
    throw new ProductDeleteRefusedError(`DELETE /produto/${product.id} responded 409`);
  if (!response.ok) throw new Error(`DELETE /produto/${product.id} responded ${response.status}`);
};

const uploadProductImage = async (produtoId: number, file: File): Promise<ProductImageRecord | null> => {
  const form = new FormData();
  form.append('file', file);
  const response = await callApi('POST', `/imagem?produtoId=${produtoId}`, form);
  try {
    const apiImage: ApiProductImage = await response.json();
    return toImageRecord(apiImage);
  } catch {
    return null;
  }
};

const deleteProductImage = async (produtoId: number, imageId: number) => {
  const response = await fetch('/api/imagem', { method: 'DELETE', ...toRequestBody({ id: imageId, produtoId }) });
  // A photo that no longer exists answers 409 on the current API (404 on the previous one).
  if (!response.ok && response.status !== HTTP_NOT_FOUND && response.status !== HTTP_CONFLICT) {
    throw new Error(`DELETE /imagem responded ${response.status}`);
  }
};

const reloadImages = async (produtoId: number, fallbackImages: string[]) => {
  try {
    return toImageUrlsInIdOrder(await fetchProductImageRecords(produtoId));
  } catch {
    return fallbackImages;
  }
};

export type PhotoSyncResult = { product: Product; failedPhotoCount: number };

export const syncProductImages = async (
  product: Product,
  currentPhotos: readonly ProductImageRecord[] | null,
  { removedPhotoIds, newFiles }: PhotoChanges,
): Promise<PhotoSyncResult> => {
  let failedPhotoCount = 0;
  const keptPhotos: ProductImageRecord[] = [];
  for (const photo of currentPhotos ?? []) {
    if (!removedPhotoIds.includes(photo.id)) {
      keptPhotos.push(photo);
      continue;
    }
    try {
      await deleteProductImage(product.id, photo.id);
    } catch {
      failedPhotoCount += 1;
      keptPhotos.push(photo);
    }
  }
  const uploadedPhotos: ProductImageRecord[] = [];
  let hasUnreadableUpload = false;
  for (const file of newFiles) {
    try {
      const uploadedPhoto = await uploadProductImage(product.id, file);
      if (uploadedPhoto) uploadedPhotos.push(uploadedPhoto);
      else hasUnreadableUpload = true;
    } catch {
      failedPhotoCount += 1;
    }
  }
  const knownImages = currentPhotos
    ? toImageUrlsInIdOrder([...keptPhotos, ...uploadedPhotos])
    : [...product.images, ...toImageUrlsInIdOrder(uploadedPhotos)];
  const images = hasUnreadableUpload ? await reloadImages(product.id, knownImages) : knownImages;
  return { product: { ...product, images }, failedPhotoCount };
};

export class PurchaseLinkError extends Error {
  constructor(readonly product: Product) {
    super(`Purchase links of product ${product.id} were not saved`);
  }
}

const sameChannelIn = (links: readonly PurchaseLink[], link: PurchaseLink) =>
  links.find((candidate) => candidate.salesChannelId === link.salesChannelId);

export const syncPurchaseLinks = async (
  product: Product,
  currentLinks: readonly PurchaseLink[],
  desiredLinks: readonly PurchaseLink[],
  salesChannels: readonly SalesChannel[],
): Promise<Product> => {
  const removedLinks = currentLinks.filter((current) => !sameChannelIn(desiredLinks, current));
  const addedLinks = desiredLinks.filter((desired) => !sameChannelIn(currentLinks, desired));
  const changedLinks = desiredLinks.filter((desired) => {
    const current = sameChannelIn(currentLinks, desired);
    return current !== undefined && current.url !== desired.url;
  });
  if (removedLinks.length + addedLinks.length + changedLinks.length === 0) return product;
  try {
    for (const link of removedLinks) await callApi('DELETE', '/canalvendaproduto', toApiPurchaseLink(product.id, link));
    for (const link of changedLinks) {
      const pair = `produtoId=${product.id}&canalVendaId=${link.salesChannelId}`;
      await callApi('PUT', `/canalvendaproduto?${pair}`, { link: link.url });
    }
    for (const link of addedLinks) await callApi('POST', '/canalvendaproduto', toApiPurchaseLink(product.id, link));
  } catch {
    const keptLinks = await fetchPurchaseLinks(product.id).catch(() => null);
    throw new PurchaseLinkError(
      keptLinks ? { ...product, storeLinks: toStoreLinksOf(product.id, keptLinks, salesChannels) } : product,
    );
  }
  return { ...product, storeLinks: toStoreLinksOf(product.id, desiredLinks, salesChannels) };
};
