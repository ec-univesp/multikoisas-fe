import Link from 'next/link';
import { fetchProducts, type Product } from '@/entities/product';
import { ProductCarousel } from './ProductCarousel';

const FEATURED_PRODUCT_LIMIT = 12;

const loadProducts = (): Promise<Product[]> => fetchProducts().catch(() => []);

export const FeaturedProducts = async () => {
  const featuredProducts = (await loadProducts()).slice(0, FEATURED_PRODUCT_LIMIT);
  if (featuredProducts.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-6 lg:px-8">
      <ProductCarousel products={featuredProducts} />
      <Link
        href="/vitrine"
        className="mt-4 flex h-11 w-full items-center justify-center rounded-lg bg-store-navy px-5 text-sm font-semibold text-white hover:bg-store-navy-950 sm:w-fit"
      >
        Ver todos os produtos
      </Link>
    </section>
  );
};
