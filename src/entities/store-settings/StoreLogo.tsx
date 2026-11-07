'use client';

import type { ReactNode } from 'react';
import { BrandMark, type BrandMarkProps } from '@/shared/ui/BrandMark';
import { useStoreSettings } from './useStoreSettings';

type StoreLogoProps = BrandMarkProps & { fallback?: ReactNode };

export const StoreLogo = ({ fallback, ...brandMarkProps }: StoreLogoProps) => {
  const { logoUrl } = useStoreSettings().settings;
  if (!logoUrl) return fallback ?? <BrandMark {...brandMarkProps} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- the logo lives in the browser image store, next/image cannot load it
    <img
      src={logoUrl}
      alt="MultiKoisas"
      className={`h-11 w-auto object-contain ${brandMarkProps.compact ? 'max-w-11' : 'max-w-48'}`}
    />
  );
};
