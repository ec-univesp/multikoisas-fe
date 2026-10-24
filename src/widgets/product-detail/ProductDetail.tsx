import Image from 'next/image';
import Link from 'next/link';
import { PRODUCT_IMAGE_PLACEHOLDER, STORE_PRESENTATION } from '@/entities/product';
import type { Product } from '@/entities/product';

export const ProductDetail = ({ product }: { product: Product }) => {
  const [coverImage = PRODUCT_IMAGE_PLACEHOLDER, ...remainingImages] = product.images;
  const photoAlt = (position: number) =>
    product.images.length === 0
      ? product.name
      : `${product.name}, foto ${position} de ${product.images.length}`;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="flex h-11 w-fit items-center text-sm font-medium text-gray-500 hover:text-brand-500"
      >
        Voltar para a vitrine
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
            <Image
              src={coverImage}
              alt={photoAlt(1)}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          {remainingImages.length > 0 && (
            <ul className="grid grid-cols-4 gap-2 sm:gap-3">
              {remainingImages.map((image, index) => (
                <li key={image} className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                  <Image
                    src={image}
                    alt={photoAlt(index + 2)}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 25vw, 12vw"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <span className="w-fit rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {product.category}
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-800 sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 whitespace-pre-line text-gray-500">{product.longDescription}</p>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-800">Onde comprar</h2>
            {product.storeLinks.length === 0 && (
              <p className="mt-3 text-sm text-gray-500">Links de compra em breve.</p>
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
