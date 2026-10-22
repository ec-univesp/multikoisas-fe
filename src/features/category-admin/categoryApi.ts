import type { Category } from '@/entities/product';

type CategoriaResponse = { id: number; nome: string };

const HTTP_CONFLICT = 409;

export class CategoryInUseError extends Error {}

const callApi = async (method: string, path: string, body?: unknown): Promise<Response> => {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === HTTP_CONFLICT) throw new CategoryInUseError(`${method} ${path} respondeu 409`);
  if (!response.ok) throw new Error(`${method} ${path} respondeu ${response.status}`);
  return response;
};

export const createCategory = async (name: string): Promise<Category> => {
  const categoria: CategoriaResponse = await (await callApi('POST', '/categoria', { nome: name })).json();
  return { id: categoria.id, name: categoria.nome };
};

export const renameCategory = async (category: Category, name: string): Promise<Category> => {
  await callApi('PUT', `/categoria/${category.id}`, { nome: name });
  return { id: category.id, name };
};

export const deleteCategory = async (category: Category): Promise<void> => {
  await callApi('DELETE', `/categoria/${category.id}`);
};
