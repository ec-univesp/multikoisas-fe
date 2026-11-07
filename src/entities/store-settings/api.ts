import { getObjectFromApi } from '@/shared/api/getFromApi';
import type { StoreSettings, StoreSettingsValues } from './types';

type StoreSettingsListener = (settings: StoreSettings) => void;

const listeners = new Set<StoreSettingsListener>();

export const onStoreSettingsSaved = (listener: StoreSettingsListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const sendToApi = async (method: string, path: string, init: RequestInit = {}): Promise<StoreSettings> => {
  const response = await fetch(`/api${path}`, { method, ...init });
  if (!response.ok) throw new Error(`${method} ${path} responded ${response.status}`);
  const settings: StoreSettings = await response.json();
  listeners.forEach((listener) => listener(settings));
  return settings;
};

export const fetchStoreSettings = () => getObjectFromApi<StoreSettings>('/configuracao');

export const saveStoreSettings = (values: StoreSettingsValues) =>
  sendToApi('PUT', '/configuracao', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });

export const saveStoreLogo = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return sendToApi('POST', '/configuracao/logo', { body: form });
};

export const removeStoreLogo = () => sendToApi('DELETE', '/configuracao/logo');
