import Link from 'next/link';
import { STORE_PRESENTATION } from '@/entities/product';
import type { Product } from '@/entities/product';
import { ProductGallery } from './ProductGallery';

export const ProductDetail = ({ product }: { product: Product }) => {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <Link
        href="/vitrine"
        className="flex h-11 w-fit items-center text-sm font-semibold text-store-navy hover:text-store-navy-950"
      >
        Voltar para a vitrine
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
        <ProductGallery name={product.name} images={product.images} />

        <div>
          <span className="w-fit rounded-full bg-store-yellow px-2 py-0.5 text-xs font-semibold text-store-navy-950">
            {product.category}
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-800 sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 whitespace-pre-line text-gray-500">{product.longDescription}</p>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-800">Onde comprar</h2>
            {product.storeLinks.length === 0 && (
              <p className="mt-3 text-sm text-gray-500">Este produto ainda não tem link de compra.</p>
            )}
            <div className="mt-3 flex flex-col gap-2">
              {product.storeLinks.map((storeLink) => (
                <a
                  key={storeLink.store}
                  href={storeLink.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className={`flex h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold shadow-theme-xs ${STORE_PRESENTATION[storeLink.store].purchaseButtonClassName}`}
                >
                  {STORE_PRESENTATION[storeLink.store].purchaseLabel}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
