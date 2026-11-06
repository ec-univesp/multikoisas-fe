export type ProductRow = { id: number; nome: string; descricaoProduto: string };
export type CategoryRow = { id: number; nome: string };
export type ProductCategoryRow = { produtoId: number; categoriaId: number };
export type SalesChannelRow = { id: number; nome: string };
export type PurchaseLinkRow = { produtoId: number; canalVendaId: number; link: string };
export type ProductImageRow = { id: number; produtoId: number; imagemUrl: string };
export type SocialNetworkRow = { id: number; descricao: string; link: string };
export type StoreSettingsRow = {
  address: string | null;
  googleReviewsUrl: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  logoUrl: string | null;
};

// The real API does not store these yet (SKI-135). Values from the store Google listing on 2026-11-06.
export const DEFAULT_STORE_SETTINGS: StoreSettingsRow = {
  address: 'Av. Prof. Luiz Inácio de Anhaia Melo, 2085 - Centreville, Santo André - SP',
  googleReviewsUrl:
    'https://www.google.com/maps/search/?api=1&query=MultiKoisas%20Av.%20Prof.%20Luiz%20In%C3%A1cio%20de%20Anhaia%20Melo%202085%20Santo%20Andr%C3%A9',
  googleRating: 4.7,
  googleReviewCount: 387,
  logoUrl: null,
};

export type ApiDatabase = {
  products: ProductRow[];
  categories: CategoryRow[];
  productCategories: ProductCategoryRow[];
  productImages: ProductImageRow[];
  socialNetworks: SocialNetworkRow[];
  salesChannels: SalesChannelRow[];
  purchaseLinks: PurchaseLinkRow[];
  storeSettings: StoreSettingsRow;
  nextId: number;
};

export type DatabaseSeed = Omit<ApiDatabase, 'nextId' | 'storeSettings'> & { storeSettings?: unknown };

const textOr = (value: unknown, fallback: string | null) =>
  value === null || typeof value === 'string' ? value : fallback;

const numberOr = (value: unknown, fallback: number | null) =>
  value === null || typeof value === 'number' ? value : fallback;

const toStoreSettingsRow = (saved: unknown): StoreSettingsRow => {
  const fields = new Map<string, unknown>(typeof saved === 'object' && saved !== null ? Object.entries(saved) : []);
  return {
    address: textOr(fields.get('address'), DEFAULT_STORE_SETTINGS.address),
    googleReviewsUrl: textOr(fields.get('googleReviewsUrl'), DEFAULT_STORE_SETTINGS.googleReviewsUrl),
    googleRating: numberOr(fields.get('googleRating'), DEFAULT_STORE_SETTINGS.googleRating),
    googleReviewCount: numberOr(fields.get('googleReviewCount'), DEFAULT_STORE_SETTINGS.googleReviewCount),
    logoUrl: textOr(fields.get('logoUrl'), DEFAULT_STORE_SETTINGS.logoUrl),
  };
};

export const createDatabase = (seed: DatabaseSeed): ApiDatabase => {
  const rows = { ...structuredClone(seed), storeSettings: toStoreSettingsRow(seed.storeSettings) };
  const ids = [
    ...rows.products,
    ...rows.categories,
    ...rows.productImages,
    ...rows.socialNetworks,
    ...rows.salesChannels,
  ].map((row) => row.id);
  return { ...rows, nextId: Math.max(0, ...ids) + 1 };
};
