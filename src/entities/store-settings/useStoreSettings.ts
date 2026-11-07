'use client';

import { useCallback, useEffect, useState } from 'react';
import type { LoadState } from '@/shared/api/useLoadOnMount';
import { STORAGE_KEY } from '@/shared/local-api/persistence';
import { fetchStoreSettings, onStoreSettingsSaved } from './api';
import { STORE_SETTINGS } from './storeSettings';
import type { StoreSettings } from './types';

type StoreSettingsState = {
  status: LoadState<StoreSettings>['status'];
  settings: StoreSettings;
  retry: () => void;
};

export const useStoreSettings = (): StoreSettingsState => {
  const [loadState, setLoadState] = useState<LoadState<StoreSettings>>({ status: 'loading' });

  const load = useCallback(() => {
    fetchStoreSettings().then(
      (data) => setLoadState({ status: 'ready', data }),
      () => setLoadState((currentState) => (currentState.status === 'ready' ? currentState : { status: 'error' })),
    );
  }, []);

  const retry = useCallback(() => {
    setLoadState({ status: 'loading' });
    load();
  }, [load]);

  useEffect(load, [load]);

  useEffect(() => onStoreSettingsSaved((data) => setLoadState({ status: 'ready', data })), []);

  useEffect(() => {
    const reloadOnSave = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) load();
    };
    window.addEventListener('storage', reloadOnSave);
    return () => window.removeEventListener('storage', reloadOnSave);
  }, [load]);

  if (loadState.status === 'ready') return { status: 'ready', settings: loadState.data, retry };
  return { status: loadState.status, settings: STORE_SETTINGS, retry };
};
