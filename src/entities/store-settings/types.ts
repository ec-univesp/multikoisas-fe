export type StoreSettings = {
  address: string | null;
  googleReviewsUrl: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  logoUrl: string | null;
};

export type StoreSettingsValues = Omit<StoreSettings, 'logoUrl'>;
