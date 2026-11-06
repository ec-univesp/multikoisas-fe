import {
  fetchProductImageRecords,
  toImageRecord,
  toImageUrlsInIdOrder,
  toProduct,
  type Category,
  type ImagemResponse,
  type Product,
  type ProductImageRecord,
  type ProdutoResponse,
} from '@/entities/product';
import { getFromApi } from '@/shared/api/getFromApi';
import type { PhotoChanges, ProductFormValues } from './types';

type CategoriaProdutoBody = { produtoId: number; categoriaId: number };

const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;

const toRequestBody = (body: unknown): RequestInit => {
  if (body === undefined) return {};
  if (body instanceof FormData) return { body };
  return { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
};

const callApi = async (method: string, path: string, body?: unknown): Promise<Response> => {
  const response = await fetch(`/api${path}`, { method, ...toRequestBody(body) });
  if (!response.ok) throw new Error(`${method} ${path} respondeu ${response.status}`);
  return response;
};

const toProdutoRequest = (values: ProductFormValues) => ({
  nome: values.name.trim(),
  descricaoProduto: values.description.trim(),
});

const linkCategory = (produtoId: number, categoriaId: number) =>
  callApi('POST', '/categoriaproduto', { produtoId, categoriaId } satisfies CategoriaProdutoBody);

const unlinkCategory = (produtoId: number, categoriaId: number) =>
  callApi('DELETE', '/categoriaproduto', { produtoId, categoriaId } satisfies CategoriaProdutoBody);

const fetchCategoryLinks = (produtoId: number): Promise<CategoriaProdutoBody[]> =>
  getFromApi<CategoriaProdutoBody>(`/categoriaproduto?produtoId=${produtoId}`, { fresh: true, fromBrowser: true });

export type EditableProduct = { product: Product; photos: ProductImageRecord[] | null };

export const loadProductForEdit = async (
  product: Product,
  categories: readonly Category[],
): Promise<EditableProduct | null> => {
  const productId = product.id;
  const [produto] = await getFromApi<ProdutoResponse>(`/produto?id=${productId}`, { fresh: true, fromBrowser: true });
  if (!produto) return null;
  const [[firstLink], photos] = await Promise.all([
    fetchCategoryLinks(productId),
    fetchProductImageRecords(productId, { fresh: true, fromBrowser: true }).catch(() => null),
  ]);
  return {
    product: toProduct(
      produto,
      categories.find((category) => category.id === firstLink?.categoriaId),
      photos ? toImageUrlsInIdOrder(photos) : product.images,
      product.storeLinks,
    ),
    photos,
  };
};

export class CategoryLinkError extends Error {
  constructor(readonly product: Product) {
    super(`Produto ${product.id} salvo sem categoria`);
  }
}

const keepOnlyCategory = async (produtoId: number, categoriaId: number) => {
  const links = await fetchCategoryLinks(produtoId);
  for (const link of links) {
    if (link.categoriaId !== categoriaId) await unlinkCategory(produtoId, link.categoriaId);
  }
  if (!links.some((link) => link.categoriaId === categoriaId)) await linkCategory(produtoId, categoriaId);
};

const findCategory = (categories: readonly Category[], values: ProductFormValues) =>
  categories.find((category) => String(category.id) === values.categoryId);

export const createProduct = async (
  values: ProductFormValues,
  categories: readonly Category[],
): Promise<Product> => {
  const produto: ProdutoResponse = await (
    await callApi('POST', '/produto', toProdutoRequest(values))
  ).json();
  const category = findCategory(categories, values);
  if (!category) return toProduct(produto, undefined);
  try {
    await linkCategory(produto.id, category.id);
  } catch {
    throw new CategoryLinkError(toProduct(produto, undefined));
  }
  return toProduct(produto, category);
};

export const updateProduct = async (
  product: Product,
  values: ProductFormValues,
  categories: readonly Category[],
): Promise<Product> => {
  const produtoRequest = toProdutoRequest(values);
  await callApi('PUT', `/produto/${product.id}`, produtoRequest);
  const produto = { id: product.id, ...produtoRequest };
  const category = findCategory(categories, values);
  if (category && category.id !== product.categoryId) {
    try {
      await keepOnlyCategory(product.id, category.id);
    } catch {
      throw new CategoryLinkError(toProduct(produto, undefined, product.images, product.storeLinks));
    }
  }
  return toProduct(produto, category, product.images, product.storeLinks);
};

// A API apaga categorias, links e fotos junto, mas responde 409 se faltar categoria ou link de compra.
export class ProductDeleteRefusedError extends Error {}

export const deleteProduct = async (product: Product): Promise<void> => {
  const response = await fetch(`/api/produto/${product.id}`, { method: 'DELETE' });
  if (response.status === HTTP_CONFLICT) throw new ProductDeleteRefusedError(`DELETE /produto/${product.id} respondeu 409`);
  if (!response.ok) throw new Error(`DELETE /produto/${product.id} respondeu ${response.status}`);
};

const uploadProductImage = async (produtoId: number, file: File): Promise<ProductImageRecord | null> => {
  const form = new FormData();
  form.append('file', file);
  const response = await callApi('POST', `/imagem?produtoId=${produtoId}`, form);
  try {
    const imagem: ImagemResponse = await response.json();
    return toImageRecord(imagem);
  } catch {
    return null;
  }
};

const deleteProductImage = async (produtoId: number, imageId: number) => {
  const response = await fetch('/api/imagem', { method: 'DELETE', ...toRequestBody({ id: imageId, produtoId }) });
  // Foto que já não existe volta 409 na API atual (404 na anterior).
  if (!response.ok && response.status !== HTTP_NOT_FOUND && response.status !== HTTP_CONFLICT) {
    throw new Error(`DELETE /imagem respondeu ${response.status}`);
  }
};

const reloadImages = async (produtoId: number, fallbackImages: string[]) => {
  try {
    return toImageUrlsInIdOrder(await fetchProductImageRecords(produtoId, { fresh: true, fromBrowser: true }));
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
