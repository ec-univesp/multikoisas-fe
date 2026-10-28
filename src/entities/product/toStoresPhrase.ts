import { STORE_PRESENTATION, type Product } from './types';

export const toStoresPhrase = (products: readonly Product[]): string | null => {
  const stores = [...new Set(products.flatMap((product) => product.storeLinks.map((storeLink) => storeLink.store)))];
  if (stores.length === 0) return null;
  const storesWithArticle = stores.map((store) => STORE_PRESENTATION[store].purchaseLabel.replace(/^Comprar /, ''));
  return new Intl.ListFormat('pt-BR', { type: 'disjunction' }).format(storesWithArticle);
};
