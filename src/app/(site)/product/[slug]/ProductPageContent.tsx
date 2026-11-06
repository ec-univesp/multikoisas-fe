'use client';

import NotFound from '@/app/not-found';
import { useCatalog } from '@/entities/product';
import { ProductDetail } from '@/widgets/product-detail';

export const ProductPageContent = ({ slug }: { slug: string }) => {
  const catalog = useCatalog();

  if (catalog.status === 'loading') {
    return (
      <section aria-busy className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <p role="status" className="text-center text-sm text-gray-500">
          Carregando produto...
        </p>
      </section>
    );
  }

  const product =
    catalog.status === 'ready' ? catalog.data.products.find((candidate) => candidate.slug === slug) : undefined;
  if (!product) return <NotFound />;
  return <ProductDetail product={product} />;
};
