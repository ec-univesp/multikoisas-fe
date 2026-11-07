// The site has no back-end: every /api request is answered in the browser by the local api (src/shared/local-api).
// The local api answers an empty list with 404 without a body (/canalvendaproduto with 204), like the real one.
const EMPTY_LIST_STATUSES = new Set([204, 404]);

export const getFromApi = async <Item>(path: string): Promise<Item[]> => {
  const response = await fetch(`/api${path}`, { cache: 'no-store' });
  if (EMPTY_LIST_STATUSES.has(response.status)) return [];
  if (!response.ok) throw new Error(`API ${path} responded ${response.status}`);
  return response.json();
};

export const getObjectFromApi = async <Data>(path: string): Promise<Data> => {
  const response = await fetch(`/api${path}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`API ${path} responded ${response.status}`);
  return response.json();
};
