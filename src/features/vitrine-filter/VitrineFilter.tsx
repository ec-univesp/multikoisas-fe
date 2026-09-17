'use client';

import { useState } from 'react';
import { ProductCard } from '@/entities/product';
import type { Product } from '@/entities/product';
import { filterProducts } from './filterProducts';

const PRIORITY_IMAGE_COUNT = 4;

type VitrineFilterProps = {
  products: readonly Product[];
  categories: readonly string[];
};

const chipClassName = (isActive: boolean): string =>
  `flex h-11 items-center rounded-full border px-4 text-sm font-medium ${
    isActive
      ? 'border-brand-500 bg-brand-500 text-white'
      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
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
          className="h-11 w-full rounded-lg border border-gray-200 px-4 text-base text-gray-800"
        />
      </div>

      {visibleProducts.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <p className="text-gray-500">Nenhum produto encontrado.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="flex h-11 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product, position) => (
            <li key={product.slug}>
              <ProductCard product={product} hasPriorityImage={position < PRIORITY_IMAGE_COUNT} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
