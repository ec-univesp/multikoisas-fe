'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/button/Button';
import { fetchCatalog, type Category, type Product } from '@/entities/product';
import type { SalesChannel } from '@/entities/sales-channel';
import { ProductAdminPanel } from './ProductAdminPanel';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; products: Product[]; categories: Category[]; salesChannels: SalesChannel[] };

const loadCatalog = async (): Promise<LoadState> => {
  try {
    const { products, categories, salesChannels } = await fetchCatalog();
    return { status: 'ready', products, categories, salesChannels };
  } catch {
    return { status: 'error' };
  }
};

export const ProductAdminScreen = () => {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;
    loadCatalog().then((state) => {
      if (isMounted) setLoadState(state);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const retry = async () => {
    setLoadState({ status: 'loading' });
    setLoadState(await loadCatalog());
  };

  if (loadState.status === 'loading') {
    return <p className="text-theme-sm text-gray-500">Carregando produtos...</p>;
  }

  if (loadState.status === 'error') {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-sm text-error-500">Não foi possível carregar os produtos.</p>
        <Button size="sm" variant="outline" onClick={retry}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  return (
    <ProductAdminPanel
      initialProducts={loadState.products}
      categories={loadState.categories}
      salesChannels={loadState.salesChannels}
    />
  );
};
