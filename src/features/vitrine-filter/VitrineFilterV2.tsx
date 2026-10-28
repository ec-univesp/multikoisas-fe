'use client';

import { ProductCardV2 } from '@/entities/product';
import type { Product } from '@/entities/product';
import { useProductFilter } from './useProductFilter';
import { useVitrineSearch, VitrineSearchField } from './VitrineSearch';

const PRIORITY_IMAGE_COUNT = 4;

type VitrineFilterV2Props = {
  products: readonly Product[];
  categories: readonly string[];
};

const chipClassName = (isActive: boolean): string =>
  `flex h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold whitespace-nowrap shadow-theme-xs ${
    isActive ? 'bg-store-navy text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
  }`;

const itemCountLabel = (count: number): string => (count === 1 ? '1 item exibido' : `${count} itens exibidos`);

export const VitrineFilterV2 = ({ products, categories }: VitrineFilterV2Props) => {
  const { activeCategory, setActiveCategory, visibleProducts, isCatalogEmpty, clearFilters } = useProductFilter(
    products,
    useVitrineSearch(),
  );

  return (
    <div>
      <div className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-theme-xs md:flex-row md:items-center">
        <VitrineSearchField id="vitrine-search" label="Buscar na vitrine" />
        <p aria-live="polite" className="shrink-0 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-store-navy">
          {itemCountLabel(visibleProducts.length)}
        </p>
      </div>

      <div role="group" aria-label="Categorias" className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          aria-pressed={activeCategory === null}
          className={chipClassName(activeCategory === null)}
          onClick={() => setActiveCategory(null)}
        >
          Todas as categorias
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

      {visibleProducts.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <p className="text-gray-500">Nenhum produto encontrado.</p>
          {!isCatalogEmpty && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex h-11 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product, position) => (
            <li key={product.slug}>
              <ProductCardV2 product={product} hasPriorityImage={position < PRIORITY_IMAGE_COUNT} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
