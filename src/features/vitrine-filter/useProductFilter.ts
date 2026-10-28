import { useState } from 'react';
import type { Product } from '@/entities/product';
import { filterProducts } from './filterProducts';

type SearchState = {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
};

export const useProductFilter = (products: readonly Product[], { searchTerm, setSearchTerm }: SearchState) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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
