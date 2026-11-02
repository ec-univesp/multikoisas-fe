'use client';

import { useEffect, useRef, useState } from 'react';
import { ProductCard, type Product } from '@/entities/product';
import { ChevronLeftIcon } from '@/icons';

type ScrollEdges = { canScrollPrevious: boolean; canScrollNext: boolean };

const SUBPIXEL_TOLERANCE_PX = 1;

const readScrollEdges = (list: HTMLUListElement): ScrollEdges => ({
  canScrollPrevious: list.scrollLeft > SUBPIXEL_TOLERANCE_PX,
  canScrollNext: list.scrollLeft + list.clientWidth < list.scrollWidth - SUBPIXEL_TOLERANCE_PX,
});

const arrowButtonClassName =
  'flex size-11 items-center justify-center rounded-full bg-white text-store-navy shadow-theme-xs hover:bg-gray-100 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-white';

const CAROUSEL_IMAGE_SIZES = '(max-width: 640px) 80vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw';

const cardClassName =
  'w-[80%] shrink-0 snap-start sm:w-[calc((100%-0.75rem)/2)] md:w-[calc((100%-1.5rem)/3)] lg:w-[calc((100%-2.25rem)/4)]';

export const ProductCarousel = ({ products }: { products: readonly Product[] }) => {
  const listRef = useRef<HTMLUListElement>(null);
  const [scrollEdges, setScrollEdges] = useState<ScrollEdges>({ canScrollPrevious: false, canScrollNext: false });

  const updateScrollEdges = () => {
    if (listRef.current) setScrollEdges(readScrollEdges(listRef.current));
  };

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const handleResize = () => setScrollEdges(readScrollEdges(list));
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollByOneCard = (direction: 1 | -1) => {
    const list = listRef.current;
    const cardWidth = list?.querySelector('li')?.offsetWidth ?? 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list?.scrollBy({ left: direction * cardWidth, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <div role="region" aria-roledescription="carrossel" aria-labelledby="produtos-em-destaque">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="produtos-em-destaque" className="text-xl font-extrabold tracking-tight text-store-navy">
          Produtos em destaque
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Ver produtos anteriores"
            aria-disabled={!scrollEdges.canScrollPrevious}
            onClick={() => scrollEdges.canScrollPrevious && scrollByOneCard(-1)}
            className={arrowButtonClassName}
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            aria-label="Ver próximos produtos"
            aria-disabled={!scrollEdges.canScrollNext}
            onClick={() => scrollEdges.canScrollNext && scrollByOneCard(1)}
            className={arrowButtonClassName}
          >
            <ChevronLeftIcon className="rotate-180" />
          </button>
        </div>
      </div>
      <ul ref={listRef} onScroll={updateScrollEdges} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {products.map((product) => (
          <li key={product.slug} className={cardClassName}>
            <ProductCard product={product} imageSizes={CAROUSEL_IMAGE_SIZES} />
          </li>
        ))}
      </ul>
    </div>
  );
};
