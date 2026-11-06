'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { startLocalApi } from './startLocalApi';

export const LocalApiProvider = ({ children }: { children: ReactNode }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    startLocalApi()
      .catch((error: unknown) => console.error(error))
      .finally(() => setIsReady(true));
  }, []);

  if (!isReady) {
    return (
      <p role="status" className="p-6 text-center text-sm text-gray-500">
        Carregando...
      </p>
    );
  }
  return children;
};
