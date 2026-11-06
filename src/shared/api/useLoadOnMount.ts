'use client';

import { useEffect, useState } from 'react';

export type LoadState<Data> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: Data };

export const useLoadOnMount = <Data>(load: () => Promise<Data>): LoadState<Data> => {
  const [loadState, setLoadState] = useState<LoadState<Data>>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;
    load().then(
      (data) => {
        if (isMounted) setLoadState({ status: 'ready', data });
      },
      () => {
        if (isMounted) setLoadState({ status: 'error' });
      },
    );
    return () => {
      isMounted = false;
    };
  }, [load]);

  return loadState;
};
