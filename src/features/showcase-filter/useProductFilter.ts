import type { Product } from '@/entities/product';
import { filterProducts } from './filterProducts';

type FilterState = {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;
};

export const useProductFilter = (products: readonly Product[], filterState: FilterState) => {
  const { searchTerm, setSearchTerm, activeCategory, setActiveCategory } = filterState;

  const clearFilters = () => {
    setActiveCategory(null);
    setSearchTerm('');
  };

  return {
    activeCategory,
    setActiveCategory,
    visibleProducts: filterProducts(products, { category: activeCategory, searchTerm }),
    isCatalogEmpty: products.length === 0,
    clearFilters,
  };
};
