'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LoadState } from '@/shared/api/useLoadOnMount';
import { onStoreSettingsSaved, readStoreSettings } from './api';
import { STORE_SETTINGS } from './storeSettings';
import type { StoreSettings } from './types';

type StoreSettingsState = {
  status: LoadState<StoreSettings>['status'];
  settings: StoreSettings;
  retry: () => void;
};

export const useStoreSettings = (): StoreSettingsState => {
  const [loadState, setLoadState] = useState<LoadState<StoreSettings>>({ status: 'loading' });

  const latestUpdate = useRef(0);

  const load = useCallback((fresh: boolean) => {
    const update = ++latestUpdate.current;
    const isLatest = () => update === latestUpdate.current;
    readStoreSettings({ fresh }).then(
      (data) => isLatest() && setLoadState({ status: 'ready', data }),
      () => isLatest() && setLoadState({ status: 'error' }),
    );
  }, []);

  const retry = useCallback(() => {
    setLoadState({ status: 'loading' });
    load(true);
  }, [load]);

  useEffect(() => load(false), [load]);

  useEffect(
    () =>
      onStoreSettingsSaved((data) => {
        latestUpdate.current += 1;
        setLoadState({ status: 'ready', data });
      }),
    [],
  );

  if (loadState.status === 'ready') return { status: 'ready', settings: loadState.data, retry };
  return { status: loadState.status, settings: STORE_SETTINGS, retry };
};
