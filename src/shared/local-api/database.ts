export type ProductRow = { id: number; nome: string; descricaoProduto: string };
export type CategoryRow = { id: number; nome: string };
export type ProductCategoryRow = { produtoId: number; categoriaId: number };
export type SalesChannelRow = { id: number; nome: string };
export type PurchaseLinkRow = { produtoId: number; canalVendaId: number; link: string };
export type ProductImageRow = { id: number; produtoId: number; imagemUrl: string };
export type UserRow = { id: number; username: string; email: string; role: string };
export type SocialNetworkRow = { id: number; descricao: string; link: string };
export type StoreRow = { id: number; nomeLoja: string; descricaoLoja: string };
export type StoreImageRow = { id: number; imagemUrl: string; tipo: string };

export type ApiDatabase = {
  products: ProductRow[];
  categories: CategoryRow[];
  productCategories: ProductCategoryRow[];
  productImages: ProductImageRow[];
  socialNetworks: SocialNetworkRow[];
  salesChannels: SalesChannelRow[];
  purchaseLinks: PurchaseLinkRow[];
  users: UserRow[];
  stores: StoreRow[];
  storeImages: StoreImageRow[];
  nextId: number;
};

export type DatabaseSeed = Omit<ApiDatabase, 'nextId' | 'stores' | 'storeImages' | 'users'> &
  Partial<Pick<ApiDatabase, 'stores' | 'storeImages' | 'users'>>;

export const createDatabase = (seed: DatabaseSeed): ApiDatabase => {
  const rows = {
    ...structuredClone(seed),
    users: structuredClone(seed.users ?? []),
    stores: structuredClone(seed.stores ?? []),
    storeImages: structuredClone(seed.storeImages ?? []),
  };
  const ids = [
    ...rows.products,
    ...rows.categories,
    ...rows.productImages,
    ...rows.socialNetworks,
    ...rows.salesChannels,
    ...rows.users,
    ...rows.stores,
    ...rows.storeImages,
  ].map((row) => row.id);
  return { ...rows, nextId: Math.max(0, ...ids) + 1 };
};
