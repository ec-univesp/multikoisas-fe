import { getFromApi } from '@/shared/api/getFromApi';
import type { StoreImageType, StoreSettings } from './types';

type ApiStore = { id: number; nomeLoja: string; descricaoLoja: string | null };
type ApiStoreImage = { id: number; imagemUrl: string; tipo: string };
type StoreSettingsListener = (settings: StoreSettings) => void;

const STORE_NAME = 'multikoisas';

const listeners = new Set<StoreSettingsListener>();

export const onStoreSettingsSaved = (listener: StoreSettingsListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const sendToApi = async (method: string, path: string, body?: unknown) => {
  const init: RequestInit =
    body instanceof FormData || body === undefined
      ? { method, body }
      : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  const response = await fetch(`/api${path}`, init);
  if (!response.ok) throw new Error(`${method} ${path} responded ${response.status}`);
};

const fetchStore = async (): Promise<ApiStore | null> =>
  (await getFromApi<ApiStore>(`/loja?nome=${STORE_NAME}`))[0] ?? null;

const fetchStoreImages = (type: StoreImageType) => getFromApi<ApiStoreImage>(`/imagemloja?tipo=${type}`);

// The API keeps placeholders such as "URL 1" among the images.
const isHttpsUrl = (url: string) => URL.canParse(url) && new URL(url).protocol === 'https:';

const newestImageUrl = (images: ApiStoreImage[]) =>
  images.filter((image) => isHttpsUrl(image.imagemUrl)).sort((first, second) => second.id - first.id)[0]
    ?.imagemUrl ?? null;

export const fetchStoreSettings = async (): Promise<StoreSettings> => {
  const [store, logos, photos] = await Promise.all([
    fetchStore(),
    fetchStoreImages('LOGO'),
    fetchStoreImages('CAPA'),
  ]);
  return {
    description: store?.descricaoLoja?.trim() || null,
    logoUrl: newestImageUrl(logos),
    photoUrl: newestImageUrl(photos),
  };
};

const reloadStoreSettings = async () => {
  const settings = await fetchStoreSettings();
  listeners.forEach((listener) => listener(settings));
  return settings;
};

const deleteStoreImage = (type: StoreImageType, image: ApiStoreImage) =>
  sendToApi('DELETE', `/imagemloja/${type}?id=${image.id}`);

export const saveStoreDescription = async (description: string) => {
  const store = await fetchStore();
  if (store) await sendToApi('PUT', `/loja/${encodeURIComponent(store.nomeLoja)}`, { descricaoLoja: description });
  else await sendToApi('POST', '/loja', { nomeLoja: STORE_NAME, descricaoLoja: description });
  return reloadStoreSettings();
};

export const saveStoreImage = async (type: StoreImageType, file: File) => {
  const olderImages = await fetchStoreImages(type);
  const form = new FormData();
  form.append('file', file);
  await sendToApi('POST', `/imagemloja?tipo=${type}`, form);
  // ponytail: an older image that fails to delete stays behind; the newest one is the one shown.
  await Promise.allSettled(olderImages.map((image) => deleteStoreImage(type, image)));
  return reloadStoreSettings();
};

export const removeStoreImage = async (type: StoreImageType) => {
  const images = await fetchStoreImages(type);
  await Promise.all(images.map((image) => deleteStoreImage(type, image)));
  return reloadStoreSettings();
};
