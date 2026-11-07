export type StoreSettings = {
  address: string | null;
  logoUrl: string | null;
};

export type StoreSettingsValues = Omit<StoreSettings, 'logoUrl'>;
