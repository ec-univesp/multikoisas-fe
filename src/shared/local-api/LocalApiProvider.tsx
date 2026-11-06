'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { startLocalApi } from './startLocalApi';

export const LocalApiProvider = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => {
  const [startState, setStartState] = useState<'starting' | 'ready' | 'failed'>('starting');

  useEffect(() => {
    startLocalApi().then(
      () => setStartState('ready'),
      (error: unknown) => {
        console.error(error);
        setStartState('failed');
      },
    );
  }, []);

  if (fallback !== undefined && startState !== 'ready') return fallback;
  if (startState === 'failed') {
    return (
      <p role="alert" className="p-6 text-center text-base text-gray-700">
        Este navegador não permite rodar o site. Use o Chrome, o Edge ou o Safari fora da janela anônima.
      </p>
    );
  }
  if (startState === 'starting') {
    return (
      <p role="status" className="p-6 text-center text-sm text-gray-500">
        Carregando...
      </p>
    );
  }
  return children;
};
