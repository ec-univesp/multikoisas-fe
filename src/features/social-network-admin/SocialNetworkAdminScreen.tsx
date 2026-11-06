'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/button/Button';
import type { SocialNetwork } from '@/entities/social-network';
import { SocialNetworkAdminPanel } from './SocialNetworkAdminPanel';
import { fetchAllSocialNetworks } from './socialNetworkApi';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; socialNetworks: SocialNetwork[] };

const loadSocialNetworks = async (): Promise<LoadState> => {
  try {
    return { status: 'ready', socialNetworks: await fetchAllSocialNetworks() };
  } catch {
    return { status: 'error' };
  }
};

export const SocialNetworkAdminScreen = () => {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;
    loadSocialNetworks().then((state) => {
      if (isMounted) setLoadState(state);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const retry = async () => {
    setLoadState({ status: 'loading' });
    setLoadState(await loadSocialNetworks());
  };

  if (loadState.status === 'loading') {
    return <p className="text-theme-sm text-gray-500">Carregando redes sociais...</p>;
  }

  if (loadState.status === 'error') {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-sm text-error-500">Não foi possível carregar as redes sociais.</p>
        <Button size="sm" variant="outline" onClick={retry}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  return <SocialNetworkAdminPanel initialSocialNetworks={loadState.socialNetworks} />;
};
