import type { Product } from '@/entities/product';

export type ProductFilter = {
  category: string | null;
  searchTerm: string;
};

const normalizeForSearch = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export const filterProducts = (
  products: readonly Product[],
  { category, searchTerm }: ProductFilter,
): readonly Product[] => {
  const normalizedSearchTerm = normalizeForSearch(searchTerm.trim());
  return products.filter((product) => {
    if (category !== null && product.category !== category) return false;
    if (normalizedSearchTerm === '') return true;
    return normalizeForSearch(product.name).includes(normalizedSearchTerm);
  });
};
