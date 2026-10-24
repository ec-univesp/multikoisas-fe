export type FetchOptions = { fresh?: boolean; fromBrowser?: boolean };

export const API_URL = process.env.MULTIKOISAS_API_URL ?? 'https://multikoisas-univesp.onrender.com';
const REVALIDATE_SECONDS = 300;

export const getFromApi = async <Body>(
  path: string,
  { fresh = false, fromBrowser = false }: FetchOptions = {},
): Promise<Body> => {
  const cachePolicy: RequestInit = fresh
    ? { cache: 'no-store' }
    : { next: { revalidate: REVALIDATE_SECONDS } };
  const baseUrl = fromBrowser ? '/api' : API_URL;
  const response = await fetch(`${baseUrl}${path}`, cachePolicy);
  if (!response.ok) throw new Error(`API ${path} respondeu ${response.status}`);
  return response.json();
};
