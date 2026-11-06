export type ProductRow = { id: number; nome: string; descricaoProduto: string };
export type CategoryRow = { id: number; nome: string };
export type ProductCategoryRow = { produtoId: number; categoriaId: number };
export type SalesChannelRow = { id: number; nome: string };
export type PurchaseLinkRow = { produtoId: number; canalVendaId: number; link: string };
export type ProductImageRow = { id: number; produtoId: number; imagemUrl: string };
export type SocialNetworkRow = { id: number; descricao: string; link: string };

export type ApiDatabase = {
  products: ProductRow[];
  categories: CategoryRow[];
  productCategories: ProductCategoryRow[];
  productImages: ProductImageRow[];
  socialNetworks: SocialNetworkRow[];
  salesChannels: SalesChannelRow[];
  purchaseLinks: PurchaseLinkRow[];
  nextId: number;
};

export type DatabaseSeed = Omit<ApiDatabase, 'nextId'>;

export const createDatabase = (seed: DatabaseSeed): ApiDatabase => {
  const rows = structuredClone(seed);
  const ids = [
    ...rows.products,
    ...rows.categories,
    ...rows.productImages,
    ...rows.socialNetworks,
    ...rows.salesChannels,
  ].map((row) => row.id);
  return { ...rows, nextId: Math.max(0, ...ids) + 1 };
};
