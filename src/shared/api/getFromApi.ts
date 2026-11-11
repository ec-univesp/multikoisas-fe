export const API_URL = process.env.MULTIKOISAS_API_URL || 'https://multikoisas-univesp.onrender.com';

// The API answers an empty list with a bodiless 404 (/canalvendaproduto, with 204).
const EMPTY_LIST_STATUSES = new Set([204, 404]);

export const getFromApi = async <Item>(path: string): Promise<Item[]> => {
  const response = await fetch(`/api${path}`, { cache: 'no-store' });
  if (EMPTY_LIST_STATUSES.has(response.status)) return [];
  if (!response.ok) throw new Error(`API ${path} responded ${response.status}`);
  return response.json();
};
