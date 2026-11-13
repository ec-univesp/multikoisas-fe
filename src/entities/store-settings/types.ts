export type StoreSettings = {
  name: string | null;
  description: string | null;
  address: string | null;
  logoUrl: string | null;
  photoUrl: string | null;
};

export type StoreSettingsValues = Pick<StoreSettings, 'description' | 'address'>;

export type StoreImageType = 'LOGO' | 'CAPA';
