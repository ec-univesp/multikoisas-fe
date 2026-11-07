'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/button/Button';
import { UserAdminPanel } from './UserAdminPanel';
import { fetchAllUsers, type UserAccount } from './userApi';

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; users: UserAccount[] };

const loadUsers = async (): Promise<LoadState> => {
  try {
    return { status: 'ready', users: await fetchAllUsers() };
  } catch {
    return { status: 'error' };
  }
};

export const UserAdminScreen = () => {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;
    loadUsers().then((state) => {
      if (isMounted) setLoadState(state);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const retry = async () => {
    setLoadState({ status: 'loading' });
    setLoadState(await loadUsers());
  };

  if (loadState.status === 'loading') {
    return <p className="text-theme-sm text-gray-500">Carregando usuários...</p>;
  }

  if (loadState.status === 'error') {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-sm text-error-500">Não foi possível carregar os usuários.</p>
        <Button size="sm" variant="outline" onClick={retry}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  return <UserAdminPanel initialUsers={loadState.users} />;
};
