'use client';

import Link from 'next/link';
import { useCatalog } from '@/entities/product';
import { ProductCarousel } from './ProductCarousel';

const FEATURED_PRODUCT_LIMIT = 12;

const sectionClassName = 'mx-auto max-w-7xl px-4 pb-6 lg:px-8';

export const FeaturedProducts = () => {
  const catalog = useCatalog();
  if (catalog.status === 'loading') {
    return (
      <section aria-busy className={sectionClassName}>
        <p role="status" className="flex h-80 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">
          Carregando produtos em destaque...
        </p>
      </section>
    );
  }
  const featuredProducts = catalog.status === 'ready' ? catalog.data.products.slice(0, FEATURED_PRODUCT_LIMIT) : [];
  if (featuredProducts.length === 0) return null;

  return (
    <section className={sectionClassName}>
      <ProductCarousel products={featuredProducts} />
      <Link
        href="/showcase"
        className="mt-4 flex h-11 w-full items-center justify-center rounded-lg bg-store-navy px-5 text-sm font-semibold text-white hover:bg-store-navy-950 sm:w-fit"
      >
        Ver todos os produtos
      </Link>
    </section>
  );
};
