import Image from 'next/image';
import Link from 'next/link';
import { STORE_PRESENTATION } from './types';
import type { Product } from './types';

type ProductCardProps = {
  product: Product;
  hasPriorityImage?: boolean;
};

export const ProductCard = ({ product, hasPriorityImage = false }: ProductCardProps) => {
  const [primaryStoreLink] = product.storeLinks;
  const [coverImage] = product.images;
  const detailPath = `/produto/${product.slug}`;
  const primaryStore = STORE_PRESENTATION[primaryStoreLink.store];

  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-3">
      <Link
        href={detailPath}
        aria-hidden
        tabIndex={-1}
        className="relative block aspect-square overflow-hidden rounded-xl bg-gray-100"
      >
        <Image
          src={coverImage}
          alt={product.name}
          fill
          priority={hasPriorityImage}
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover transition-transform duration-200 hover:scale-105"
        />
      </Link>
      <h3 className="mt-3 font-semibold text-gray-800">
        <Link href={detailPath} className="hover:text-brand-500">
          {product.name}
        </Link>
      </h3>
      <span className="mt-1 w-fit rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
        {product.category}
      </span>
      <p className="mt-2 line-clamp-1 text-sm text-gray-500">{product.shortDescription}</p>
      <div className="mt-auto flex flex-col gap-2 pt-4">
        <a
          href={primaryStoreLink.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={`flex h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold shadow-theme-xs ${primaryStore.purchaseButtonClassName}`}
        >
          {primaryStore.purchaseLabel}
        </a>
        <Link
          href={detailPath}
          className="flex h-11 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Ver detalhes
        </Link>
      </div>
    </article>
  );
};
