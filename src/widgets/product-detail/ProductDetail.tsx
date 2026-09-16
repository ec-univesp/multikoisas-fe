import Image from 'next/image';
import Link from 'next/link';
import { PURCHASE_CTA_LABEL_BY_STORE } from '@/entities/product';
import type { Product } from '@/entities/product';

export const ProductDetail = ({ product }: { product: Product }) => {
  const [coverImage, ...remainingImages] = product.images;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="flex h-11 w-fit items-center text-sm font-medium text-gray-600 hover:text-brand-blue dark:text-gray-400 dark:hover:text-white"
      >
        Voltar para a vitrine
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 dark:bg-gray-800">
            <Image
              src={coverImage}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          {remainingImages.map((image) => (
            <div
              key={image}
              className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 dark:bg-gray-800"
            >
              <Image
                src={image}
                alt={product.name}
                fill
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        <div>
          <span className="w-fit rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {product.category}
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-blue sm:text-4xl dark:text-white">
            {product.name}
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{product.longDescription}</p>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-brand-blue dark:text-white">Onde comprar</h2>
            <div className="mt-3 flex flex-col gap-2">
              {product.storeLinks.map((storeLink) => (
                <a
                  key={storeLink.store}
                  href={storeLink.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="flex h-11 items-center justify-center rounded-lg bg-brand-yellow px-4 text-sm font-semibold text-brand-blue"
                >
                  {PURCHASE_CTA_LABEL_BY_STORE[storeLink.store]}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
