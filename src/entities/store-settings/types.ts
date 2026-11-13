export type ShowcaseColumns = 2 | 3 | 4;

export type StoreSettings = {
  name: string | null;
  description: string | null;
  address: string | null;
  logoUrl: string | null;
  photoUrl: string | null;
  showcaseColumns: ShowcaseColumns;
  accentColor: string;
};

export type StoreSettingsValues = Pick<StoreSettings, 'description' | 'address'>;

export type ShowcaseAppearance = Pick<StoreSettings, 'showcaseColumns' | 'accentColor'>;

export type StoreImageType = 'LOGO' | 'CAPA';
