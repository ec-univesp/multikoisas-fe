'use client';

import type { CSSProperties, ReactNode } from 'react';
import { STORE_SETTINGS } from './storeSettings';
import { useStoreSettings } from './useStoreSettings';

export const StoreAccentColor = ({ children }: { children: ReactNode }) => {
  const { accentColor } = useStoreSettings().settings;
  const accentStyle: Record<string, string> = { '--color-store-yellow': accentColor };
  const style: CSSProperties | undefined = accentColor === STORE_SETTINGS.accentColor ? undefined : accentStyle;
  return (
    <div className="contents" style={style}>
      {children}
    </div>
  );
};
