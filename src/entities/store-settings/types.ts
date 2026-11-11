export type StoreSettings = {
  description: string | null;
  logoUrl: string | null;
  photoUrl: string | null;
};

export type StoreSettingsValues = Pick<StoreSettings, 'description'>;

export type StoreImageType = 'LOGO' | 'CAPA';
