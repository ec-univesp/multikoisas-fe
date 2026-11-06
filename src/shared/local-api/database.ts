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

export type DatabaseSeed = Omit<ApiDatabase, 'nextId' | 'storeSettings'> & { storeSettings?: StoreSettingsRow };

export const createDatabase = (seed: DatabaseSeed): ApiDatabase => {
  const rows = structuredClone({ storeSettings: DEFAULT_STORE_SETTINGS, ...seed });
  const ids = [
    ...rows.products,
    ...rows.categories,
    ...rows.productImages,
    ...rows.socialNetworks,
    ...rows.salesChannels,
  ].map((row) => row.id);
  return { ...rows, nextId: Math.max(0, ...ids) + 1 };
};
