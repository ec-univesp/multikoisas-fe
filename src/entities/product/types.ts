export type StoreSlug = 'mercado-livre' | 'shopee';

export const STORE_LABELS: Record<StoreSlug, string> = {
  'mercado-livre': 'Mercado Livre',
  shopee: 'Shopee',
};

export type StoreLink = {
  store: StoreSlug;
  url: string;
};

export type Product = {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  longDescription: string;
  images: string[];
  storeLinks: StoreLink[];
};
