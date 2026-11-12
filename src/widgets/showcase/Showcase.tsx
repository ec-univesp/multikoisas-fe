'use client';

import { useCatalog } from '@/entities/product';
import { ShowcaseFilter, ShowcaseHeading } from '@/features/showcase-filter';

export const Showcase = () => {
  const catalog = useCatalog();
  const products = catalog.status === 'ready' ? catalog.data.products : [];
  const categories = [
    ...new Set(products.flatMap((product) => product.categories.map((category) => category.name))),
  ].sort();

  return (
    <section aria-busy={catalog.status === 'loading'} className="mx-auto max-w-7xl px-4 pt-6 pb-12 lg:px-8">
      <ShowcaseHeading />
      <p className="mt-1 mb-4 text-gray-600">
        Busque pelo nome ou escolha uma categoria. Abra o produto para ver todos os detalhes.
      </p>
      {catalog.status === 'loading' ? (
        <p role="status" className="py-10 text-center text-sm text-gray-500">
          Carregando produtos...
        </p>
      ) : (
        <ShowcaseFilter products={products} categories={categories} />
      )}
    </section>
  );
};
