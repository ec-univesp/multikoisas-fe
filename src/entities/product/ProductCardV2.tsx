import Link from 'next/link';
import { ProductImage } from './ProductImage';
import { PRODUCT_IMAGE_PLACEHOLDER, STORE_PRESENTATION } from './types';
import type { Product } from './types';

type ProductCardV2Props = {
  product: Product;
  hasPriorityImage?: boolean;
};

export const ProductCardV2 = ({ product, hasPriorityImage = false }: ProductCardV2Props) => {
  const coverImage = product.images[0] ?? PRODUCT_IMAGE_PLACEHOLDER;
  const detailPath = `/produto/${product.slug}`;
  const storeButtonsLayout = product.storeLinks.length > 1 ? 'grid gap-2 sm:grid-cols-2' : 'grid gap-2';

  return (
    <article className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-3 shadow-theme-xs">
      <Link
        href={detailPath}
        aria-hidden
        tabIndex={-1}
        className="relative block aspect-square overflow-hidden rounded-lg bg-gray-50"
      >
        <ProductImage
          src={coverImage}
          alt={product.name}
          fill
          priority={hasPriorityImage}
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-contain p-2"
        />
      </Link>
      <span className="mt-3 text-xs font-semibold tracking-wider text-store-navy uppercase">{product.category}</span>
      <h3 className="mt-1 line-clamp-2 font-semibold leading-tight text-gray-800">{product.name}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{product.shortDescription}</p>
      <div className="mt-auto flex flex-col gap-2 pt-4">
        {product.storeLinks.length > 0 && (
          <div className={storeButtonsLayout}>
            {product.storeLinks.map((storeLink) => (
              <a
                key={`${storeLink.store}:${storeLink.url}`}
                href={storeLink.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                aria-label={STORE_PRESENTATION[storeLink.store].purchaseLabel}
                className={`flex h-11 items-center justify-center rounded-lg px-2 text-sm font-semibold ${STORE_PRESENTATION[storeLink.store].purchaseButtonClassName}`}
              >
                {STORE_PRESENTATION[storeLink.store].name}
              </a>
            ))}
          </div>
        )}
        <Link
          href={detailPath}
          className="flex h-11 items-center justify-center rounded-lg bg-store-navy px-4 text-sm font-semibold text-white hover:bg-store-navy-950"
        >
          Opções de compra
        </Link>
      </div>
    </article>
  );
};
