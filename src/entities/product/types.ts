export type StoreSlug = 'mercado-livre' | 'shopee';

export const STORE_LABELS: Record<StoreSlug, string> = {
  'mercado-livre': 'Mercado Livre',
  shopee: 'Shopee',
};

export const PURCHASE_CTA_LABEL_BY_STORE: Record<StoreSlug, string> = {
  'mercado-livre': `Comprar no ${STORE_LABELS['mercado-livre']}`,
  shopee: `Comprar na ${STORE_LABELS.shopee}`,
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
