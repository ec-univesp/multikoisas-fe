'use client';

import { useEffect } from 'react';
import NotFound from '@/app/not-found';
import Button from '@/components/ui/button/Button';
import { useCatalog } from '@/entities/product';
import { ProductDetail } from '@/widgets/product-detail';

export const ProductPageContent = ({ slug }: { slug: string }) => {
  const catalog = useCatalog();
  const product =
    catalog.status === 'ready' ? catalog.data.products.find((candidate) => candidate.slug === slug) : undefined;
  const productName = product?.name;

  useEffect(() => {
    if (productName) document.title = `${productName} | MultiKoisas`;
  }, [productName]);

  if (catalog.status === 'loading') {
    return (
      <section aria-busy className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <p role="status" className="text-center text-sm text-gray-500">
          Carregando produto...
        </p>
      </section>
    );
  }

  if (catalog.status === 'error') {
    return (
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div role="alert" className="flex flex-col items-center gap-4 text-center">
          <p className="text-base text-gray-700">Não foi possível carregar o produto.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Tentar de novo
          </Button>
        </div>
      </section>
    );
  }

  if (!product) return <NotFound />;
  return <ProductDetail product={product} />;
};
