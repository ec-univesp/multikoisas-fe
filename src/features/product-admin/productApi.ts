import { fetchProductImages, toProduct, type Category, type Product, type ProdutoResponse } from '@/entities/product';
import type { ProductFormValues } from './types';

type CategoriaProdutoBody = { produtoId: number; categoriaId: number };

const HTTP_NOT_FOUND = 404;

const callApi = async (method: string, path: string, body?: unknown): Promise<Response> => {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
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
  const response = await fetch(`/api/categoriaproduto?produto=${produtoId}`);
  // A API responde 404, e não [], para produto sem categoria (UNIV-28 no santi).
  if (response.status === HTTP_NOT_FOUND) return [];
  if (!response.ok) throw new Error(`GET /categoriaproduto respondeu ${response.status}`);
  return response.json();
};

export const loadProductForEdit = async (
  product: Product,
  categories: readonly Category[],
): Promise<Product | null> => {
  const productId = product.id;
  const response = await fetch(`/api/produto/${productId}`, { cache: 'no-store' });
  if (response.status === HTTP_NOT_FOUND) return null;
  if (!response.ok) throw new Error(`GET /produto/${productId} respondeu ${response.status}`);
  const produto: ProdutoResponse = await response.json();
  const [[firstLink], images] = await Promise.all([
    fetchCategoryLinks(productId),
    fetchProductImages(productId, { fresh: true, fromBrowser: true }).catch(() => product.images),
  ]);
  return toProduct(produto, categories.find((category) => category.id === firstLink?.categoriaId), images);
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
      throw new CategoryLinkError(toProduct(produto, undefined, product.images));
    }
  }
  return toProduct(produto, category, product.images);
};

export const deleteProduct = async (product: Product): Promise<void> => {
  const links = await fetchCategoryLinks(product.id);
  for (const link of links) await unlinkCategory(link.produtoId, link.categoriaId);
  await callApi('DELETE', `/produto/${product.id}`);
};
