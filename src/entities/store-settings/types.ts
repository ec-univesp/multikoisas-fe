import type { ShowcaseColumns } from '@/shared/local-api/database';

export type { ShowcaseColumns };

export type StoreSettings = {
  address: string | null;
  logoUrl: string | null;
  showcaseColumns: ShowcaseColumns;
  accentColor: string;
};

export type StoreSettingsValues = Partial<Omit<StoreSettings, 'logoUrl'>>;
