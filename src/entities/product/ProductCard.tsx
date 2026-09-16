import Image from 'next/image';
import Link from 'next/link';
import { PURCHASE_CTA_LABEL_BY_STORE } from './types';
import type { Product } from './types';

export const ProductCard = ({ product }: { product: Product }) => {
  const [primaryStoreLink] = product.storeLinks;
  const [coverImage] = product.images;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100 dark:bg-gray-800">
        <Image
          src={coverImage}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover"
        />
      </div>
      <h3 className="mt-3 font-semibold text-brand-blue dark:text-white">{product.name}</h3>
      <span className="mt-1 w-fit rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        {product.category}
      </span>
      <p className="mt-2 line-clamp-1 text-sm text-gray-600 dark:text-gray-400">{product.shortDescription}</p>
      <div className="mt-auto flex flex-col gap-2 pt-4">
        <a
          href={primaryStoreLink.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex h-11 items-center justify-center rounded-lg bg-brand-yellow px-4 text-sm font-semibold text-brand-blue"
        >
          {PURCHASE_CTA_LABEL_BY_STORE[primaryStoreLink.store]}
        </a>
        <Link
          href={`/produto/${product.slug}`}
          className="flex h-11 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-medium text-brand-blue dark:border-gray-700 dark:text-white"
        >
          Ver detalhes
        </Link>
      </div>
    </article>
  );
};
