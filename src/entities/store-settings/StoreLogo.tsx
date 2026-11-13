'use client';

import type { ReactNode } from 'react';
import { BrandMark, type BrandMarkProps } from '@/shared/ui/BrandMark';
import { useStoreSettings } from './useStoreSettings';

type StoreLogoProps = BrandMarkProps & { fallback?: ReactNode; imageHeightClassName?: string; imageAlt?: string };

export const StoreLogo = ({
  fallback,
  imageHeightClassName = 'h-11',
  imageAlt = 'MultiKoisas',
  ...brandMarkProps
}: StoreLogoProps) => {
  const { logoUrl } = useStoreSettings().settings;
  if (!logoUrl) return fallback ?? <BrandMark {...brandMarkProps} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- the logo can come from any https host, next/image only loads the configured ones
    <img
      src={logoUrl}
      alt={imageAlt}
      className={`${imageHeightClassName} w-auto object-contain ${brandMarkProps.compact ? 'max-w-11' : 'max-w-48'}`}
    />
  );
};
