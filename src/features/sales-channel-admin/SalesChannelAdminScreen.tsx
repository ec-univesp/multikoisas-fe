'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/button/Button';
import { fetchSalesChannels, type SalesChannel } from '@/entities/sales-channel';
import { SalesChannelAdminPanel } from './SalesChannelAdminPanel';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; salesChannels: SalesChannel[] };

const loadSalesChannels = async (): Promise<LoadState> => {
  try {
    return { status: 'ready', salesChannels: await fetchSalesChannels({ fresh: true, fromBrowser: true }) };
  } catch {
    return { status: 'error' };
  }
};

export const SalesChannelAdminScreen = () => {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;
    loadSalesChannels().then((state) => {
      if (isMounted) setLoadState(state);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const retry = async () => {
    setLoadState({ status: 'loading' });
    setLoadState(await loadSalesChannels());
  };

  if (loadState.status === 'loading') {
    return <p className="text-theme-sm text-gray-500">Carregando canais...</p>;
  }

  if (loadState.status === 'error') {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-sm text-error-500">Não foi possível carregar os canais.</p>
        <Button size="sm" variant="outline" onClick={retry}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  return <SalesChannelAdminPanel initialSalesChannels={loadState.salesChannels} />;
};
