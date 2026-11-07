import { isReadableAccentColor } from '@/shared/lib/accentColor';
export type ProductRow = { id: number; nome: string; descricaoProduto: string };
export type CategoryRow = { id: number; nome: string };
export type ProductCategoryRow = { produtoId: number; categoriaId: number };
export type SalesChannelRow = { id: number; nome: string };
export type PurchaseLinkRow = { produtoId: number; canalVendaId: number; link: string };
export type ProductImageRow = { id: number; produtoId: number; imagemUrl: string };
export type UserRow = { id: number; username: string; email: string; role: string };
export type SocialNetworkRow = { id: number; descricao: string; link: string };
export type ShowcaseColumns = 2 | 3 | 4;

export type StoreSettingsRow = {
  address: string | null;
  logoUrl: string | null;
  showcaseColumns: ShowcaseColumns;
  accentColor: string;
};

// The real API does not store these yet (SKI-135).
export const DEFAULT_STORE_SETTINGS: StoreSettingsRow = {
  address: 'Av. Prof. Luiz Inácio de Anhaia Melo, 2085 - Centreville, Santo André - SP',
  logoUrl: null,
  showcaseColumns: 4,
  accentColor: '#facc15',
};

export type ApiDatabase = {
  products: ProductRow[];
  categories: CategoryRow[];
  productCategories: ProductCategoryRow[];
  productImages: ProductImageRow[];
  socialNetworks: SocialNetworkRow[];
  salesChannels: SalesChannelRow[];
  purchaseLinks: PurchaseLinkRow[];
  users: UserRow[];
  storeSettings: StoreSettingsRow;
  nextId: number;
};

export type DatabaseSeed = Omit<ApiDatabase, 'nextId' | 'storeSettings' | 'users'> & {
  storeSettings?: unknown;
  users?: UserRow[];
};

const textOr = (value: unknown, fallback: string | null) =>
  value === null || typeof value === 'string' ? value : fallback;

export const isShowcaseColumns = (value: unknown): value is ShowcaseColumns =>
  value === 2 || value === 3 || value === 4;

export const isAccentColor = isReadableAccentColor;

const toStoreSettingsRow = (saved: unknown): StoreSettingsRow => {
  const fields = new Map<string, unknown>(typeof saved === 'object' && saved !== null ? Object.entries(saved) : []);
  const showcaseColumns = fields.get('showcaseColumns');
  const accentColor = fields.get('accentColor');
  return {
    address: textOr(fields.get('address'), DEFAULT_STORE_SETTINGS.address),
    logoUrl: textOr(fields.get('logoUrl'), DEFAULT_STORE_SETTINGS.logoUrl),
    showcaseColumns: isShowcaseColumns(showcaseColumns) ? showcaseColumns : DEFAULT_STORE_SETTINGS.showcaseColumns,
    accentColor: isAccentColor(accentColor) ? accentColor.toLowerCase() : DEFAULT_STORE_SETTINGS.accentColor,
  };
};

export const createDatabase = (seed: DatabaseSeed): ApiDatabase => {
  const rows = {
    ...structuredClone(seed),
    users: structuredClone(seed.users ?? []),
    storeSettings: toStoreSettingsRow(seed.storeSettings),
  };
  const ids = [
    ...rows.products,
    ...rows.categories,
    ...rows.productImages,
    ...rows.socialNetworks,
    ...rows.salesChannels,
    ...rows.users,
  ].map((row) => row.id);
  return { ...rows, nextId: Math.max(0, ...ids) + 1 };
};
