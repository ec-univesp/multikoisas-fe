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
import type { PhotoChanges, ProductFormValues } from './types';

type CategoriaProdutoBody = { produtoId: number; categoriaId: number };

const HTTP_NOT_FOUND = 404;

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

const fetchCategoryLinks = async (produtoId: number): Promise<CategoriaProdutoBody[]> => {
  const response = await fetch(`/api/categoriaproduto?produtoId=${produtoId}`);
  // A API responde 404, e não [], para produto sem categoria (UNIV-28 no santi).
  if (response.status === HTTP_NOT_FOUND) return [];
  if (!response.ok) throw new Error(`GET /categoriaproduto respondeu ${response.status}`);
  return response.json();
};

export type EditableProduct = { product: Product; photos: ProductImageRecord[] | null };

export const loadProductForEdit = async (
  product: Product,
  categories: readonly Category[],
): Promise<EditableProduct | null> => {
  const productId = product.id;
  const response = await fetch(`/api/produto/${productId}`, { cache: 'no-store' });
  if (response.status === HTTP_NOT_FOUND) return null;
  if (!response.ok) throw new Error(`GET /produto/${productId} respondeu ${response.status}`);
  const produto: ProdutoResponse = await response.json();
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

export const deleteProduct = async (product: Product): Promise<void> => {
  const links = await fetchCategoryLinks(product.id);
  for (const link of links) await unlinkCategory(link.produtoId, link.categoriaId);
  await callApi('DELETE', `/produto/${product.id}`);
};

const uploadProductImage = async (produtoId: number, file: File): Promise<ProductImageRecord> => {
  const form = new FormData();
  form.append('produtoId', String(produtoId));
  form.append('file', file);
  const imagem: ImagemResponse = await (await callApi('POST', '/imagem', form)).json();
  return toImageRecord(imagem);
};

const deleteProductImage = (produtoId: number, imageId: number) =>
  callApi('DELETE', '/imagem', { id: imageId, produtoId });

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
  for (const file of newFiles) {
    try {
      uploadedPhotos.push(await uploadProductImage(product.id, file));
    } catch {
      failedPhotoCount += 1;
    }
  }
  const images = currentPhotos
    ? toImageUrlsInIdOrder([...keptPhotos, ...uploadedPhotos])
    : [...product.images, ...toImageUrlsInIdOrder(uploadedPhotos)];
  return { product: { ...product, images }, failedPhotoCount };
};
