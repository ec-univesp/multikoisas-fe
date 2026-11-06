export type FetchOptions = { fresh?: boolean; fromBrowser?: boolean };

export const API_URL = process.env.MULTIKOISAS_API_URL ?? 'https://multikoisas-univesp.onrender.com';
const REVALIDATE_SECONDS = 300;

// A API responde lista vazia com 404 sem corpo (/canalvendaproduto, com 204).
const EMPTY_LIST_STATUSES = new Set([204, 404]);

export const getFromApi = async <Item>(
  path: string,
  { fresh = false, fromBrowser = false }: FetchOptions = {},
): Promise<Item[]> => {
  const cachePolicy: RequestInit = fresh ? { cache: 'no-store' } : { next: { revalidate: REVALIDATE_SECONDS } };
  const baseUrl = fromBrowser ? '/api' : API_URL;
  const response = await fetch(`${baseUrl}${path}`, cachePolicy);
  if (EMPTY_LIST_STATUSES.has(response.status)) return [];
  if (!response.ok) throw new Error(`API ${path} respondeu ${response.status}`);
  return response.json();
};
