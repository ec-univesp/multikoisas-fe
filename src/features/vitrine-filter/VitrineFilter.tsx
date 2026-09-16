'use client';

import { useState } from 'react';
import { ProductCard } from '@/entities/product';
import type { Product } from '@/entities/product';
import { filterProducts } from './filterProducts';

type VitrineFilterProps = {
  products: readonly Product[];
  categories: readonly string[];
};

const chipClassName = (isActive: boolean): string =>
  `flex h-11 items-center rounded-full px-4 text-sm font-medium ${
    isActive
      ? 'bg-brand-blue text-white'
      : 'bg-neutral-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }`;

export const VitrineFilter = ({ products, categories }: VitrineFilterProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const visibleProducts = filterProducts(products, { category: activeCategory, searchTerm });

  const clearFilters = () => {
    setActiveCategory(null);
    setSearchTerm('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={activeCategory === null}
          className={chipClassName(activeCategory === null)}
          onClick={() => setActiveCategory(null)}
        >
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={activeCategory === category}
            className={chipClassName(activeCategory === category)}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <label htmlFor="vitrine-search" className="sr-only">
          Buscar produto
        </label>
        <input
          id="vitrine-search"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar produto"
          className="h-11 w-full rounded-lg border border-gray-200 px-4 text-base text-gray-900 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
        />
      </div>

      {visibleProducts.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <p className="text-gray-600 dark:text-gray-400">Nenhum produto encontrado.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="flex h-11 items-center justify-center rounded-lg bg-brand-yellow px-4 text-sm font-semibold text-brand-blue"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product) => (
            <li key={product.slug}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
