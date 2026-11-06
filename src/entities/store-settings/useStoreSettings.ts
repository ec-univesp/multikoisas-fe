import { useEffect, useState } from 'react';
import { useLoadOnMount, type LoadState } from '@/shared/api/useLoadOnMount';
import { fetchStoreSettings, onStoreSettingsSaved } from './api';
import { STORE_SETTINGS } from './storeSettings';
import type { StoreSettings } from './types';

type StoreSettingsState = { status: LoadState<StoreSettings>['status']; settings: StoreSettings };

const loadStoreSettings = () => fetchStoreSettings();

export const useStoreSettings = (): StoreSettingsState => {
  const loadState = useLoadOnMount(loadStoreSettings);
  const [savedSettings, setSavedSettings] = useState<StoreSettings | null>(null);

  useEffect(() => onStoreSettingsSaved(setSavedSettings), []);

  if (savedSettings) return { status: 'ready', settings: savedSettings };
  if (loadState.status === 'ready') return { status: 'ready', settings: loadState.data };
  return { status: loadState.status, settings: STORE_SETTINGS };
};
