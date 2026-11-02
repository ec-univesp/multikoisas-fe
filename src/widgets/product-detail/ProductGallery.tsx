'use client';

import { type KeyboardEvent, type PointerEvent, useRef, useState } from 'react';
import { PRODUCT_IMAGE_PLACEHOLDER, ProductImage } from '@/entities/product';
import { ChevronLeftIcon } from '@/icons';

type ProductGalleryProps = { name: string; images: string[] };

const SWIPE_THRESHOLD_PX = 40;

const arrowButtonClassName =
  'absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow-theme-xs hover:bg-white';

export const ProductGallery = ({ name, images }: ProductGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const swipeStartX = useRef<number | null>(null);
  const hasSeveralImages = images.length > 1;
  const selectedImage = images[selectedIndex] ?? PRODUCT_IMAGE_PLACEHOLDER;
  const selectedAlt = images.length === 0 ? name : `${name}, foto ${selectedIndex + 1} de ${images.length}`;

  const moveBy = (step: number) => {
    if (!hasSeveralImages) return;
    setSelectedIndex((currentIndex) => (currentIndex + step + images.length) % images.length);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') moveBy(1);
    if (event.key === 'ArrowLeft') moveBy(-1);
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (swipeStartX.current === null) return;
    const swipeDistance = event.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(swipeDistance) < SWIPE_THRESHOLD_PX) return;
    moveBy(swipeDistance < 0 ? 1 : -1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        role="region"
        aria-roledescription="carrossel"
        aria-label={`Fotos de ${name}`}
        tabIndex={hasSeveralImages ? 0 : undefined}
        onKeyDown={handleKeyDown}
        onPointerDown={(event) => {
          swipeStartX.current = event.clientX;
        }}
        onPointerUp={handlePointerUp}
        className="relative aspect-square touch-pan-y overflow-hidden rounded-2xl bg-gray-100"
      >
        <ProductImage
          src={selectedImage}
          alt={selectedAlt}
          fill
          preload
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
        {hasSeveralImages && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => moveBy(-1)}
              className={`${arrowButtonClassName} left-2`}
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              aria-label="Próxima foto"
              onClick={() => moveBy(1)}
              className={`${arrowButtonClassName} right-2`}
            >
              <ChevronLeftIcon className="rotate-180" />
            </button>
            <span
              aria-live="polite"
              className="absolute right-2 bottom-2 rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-800"
            >
              {selectedIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {hasSeveralImages && (
        <ul className="grid grid-cols-4 gap-2 sm:gap-3">
          {images.map((image, index) => (
            <li key={index}>
              <button
                type="button"
                aria-label={`Ver foto ${index + 1} de ${images.length}`}
                aria-pressed={index === selectedIndex}
                onClick={() => setSelectedIndex(index)}
                className={`relative block aspect-square min-h-11 w-full overflow-hidden rounded-xl bg-gray-100 ring-2 ${index === selectedIndex ? 'ring-store-navy' : 'ring-transparent'}`}
              >
                <ProductImage src={image} alt="" fill loading="lazy" sizes="(max-width: 768px) 25vw, 12vw" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
