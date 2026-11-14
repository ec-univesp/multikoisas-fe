import { storePresentationOf, type Product } from './types';

export const toStoresPhrase = (products: readonly Product[]): string | null => {
  const storesWithArticle = [
    ...new Set(
      products.flatMap((product) =>
        product.storeLinks.map((storeLink) => storePresentationOf(storeLink).purchaseLabel.replace(/^Comprar /, '')),
      ),
    ),
  ];
  if (storesWithArticle.length === 0) return null;
  return new Intl.ListFormat('pt-BR', { type: 'disjunction' }).format(storesWithArticle);
};
