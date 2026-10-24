'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/button/Button';
import { fetchCategories, type Category } from '@/entities/product';
import { CategoryAdminPanel } from './CategoryAdminPanel';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; categories: Category[] };

const loadCategories = async (): Promise<LoadState> => {
  try {
    return { status: 'ready', categories: await fetchCategories({ fresh: true, fromBrowser: true }) };
  } catch {
    return { status: 'error' };
  }
};

export const CategoryAdminScreen = () => {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;
    loadCategories().then((state) => {
      if (isMounted) setLoadState(state);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const retry = async () => {
    setLoadState({ status: 'loading' });
    setLoadState(await loadCategories());
  };

  if (loadState.status === 'loading') {
    return <p className="text-theme-sm text-gray-500">Carregando categorias...</p>;
  }

  if (loadState.status === 'error') {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-sm text-error-500">Não foi possível carregar as categorias.</p>
        <Button size="sm" variant="outline" onClick={retry}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  return <CategoryAdminPanel initialCategories={loadState.categories} />;
};
