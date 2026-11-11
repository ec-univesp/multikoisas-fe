import { getFromApi } from '@/shared/api/getFromApi';
import { toDisplayableImageUrl } from '@/shared/api/imageUrl';
import type { StoreImageType, StoreSettings, StoreSettingsValues } from './types';

type ApiStore = { id: number; nomeLoja: string; descricaoLoja: string | null; endereco: string | null };
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

const fetchAllStoreImages = () => getFromApi<ApiStoreImage>('/imagemloja');

// The API keeps placeholders such as "URL 1" among the images; only displayable ones are shown or deleted.
const displayableImages = (images: ApiStoreImage[]) =>
  images.flatMap((image) => {
    const imagemUrl = toDisplayableImageUrl(image.imagemUrl);
    return imagemUrl ? [{ ...image, imagemUrl }] : [];
  });

const newestImageUrl = (images: ApiStoreImage[]) =>
  displayableImages(images).sort((first, second) => second.id - first.id)[0]?.imagemUrl ?? null;

const valueOf = <Value>(result: PromiseSettledResult<Value>) => (result.status === 'fulfilled' ? result.value : null);

export const fetchStoreSettings = async (): Promise<StoreSettings> => {
  const [store, images] = await Promise.allSettled([fetchStore(), fetchAllStoreImages()]);
  // Without the store row the panel would offer an empty description and save it over the real one.
  if (store.status === 'rejected') throw new Error('The store row could not be read');
  const storeImages = valueOf(images) ?? [];
  const imagesOf = (type: StoreImageType) => storeImages.filter((image) => image.tipo === type);
  return {
    description: store.value?.descricaoLoja?.trim() || null,
    address: store.value?.endereco?.trim() || null,
    logoUrl: newestImageUrl(imagesOf('LOGO')),
    photoUrl: newestImageUrl(imagesOf('CAPA')),
  };
};

let inFlightRead: Promise<StoreSettings> | null = null;

export const readStoreSettings = ({ fresh = false } = {}) => {
  if (inFlightRead && !fresh) return inFlightRead;
  const read = fetchStoreSettings().finally(() => {
    if (inFlightRead === read) inFlightRead = null;
  });
  inFlightRead = read;
  return read;
};

const reloadStoreSettings = async () => {
  const settings = await readStoreSettings({ fresh: true });
  listeners.forEach((listener) => listener(settings));
  return settings;
};

const deleteDisplayableImages = async (type: StoreImageType, images: ApiStoreImage[]) => {
  const deletions = await Promise.allSettled(
    displayableImages(images).map((image) => sendToApi('DELETE', `/imagemloja/${type}?id=${image.id}`)),
  );
  return deletions.find((deletion) => deletion.status === 'rejected');
};

export const saveStoreSettings = async ({ description, address }: StoreSettingsValues) => {
  const store = await fetchStore();
  const fields = { descricaoLoja: description, endereco: address };
  if (store) await sendToApi('PUT', `/loja/${encodeURIComponent(store.nomeLoja)}`, fields);
  else await sendToApi('POST', '/loja', { nomeLoja: STORE_NAME, ...fields });
  return reloadStoreSettings();
};

export const saveStoreImage = async (type: StoreImageType, file: File) => {
  const olderImages = await fetchStoreImages(type);
  const form = new FormData();
  form.append('file', file);
  await sendToApi('POST', `/imagemloja?tipo=${type}`, form);
  // ponytail: an older image that fails to delete stays behind; the newest one is the one shown.
  await deleteDisplayableImages(type, olderImages);
  return reloadStoreSettings().catch(() => null);
};

export const removeStoreImage = async (type: StoreImageType) => {
  const failedDeletion = await deleteDisplayableImages(type, await fetchStoreImages(type));
  const settings = await reloadStoreSettings();
  if (failedDeletion) throw failedDeletion.reason;
  return settings;
};
