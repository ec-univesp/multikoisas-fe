'use client';

import { useState } from 'react';
import { PRODUCT_IMAGE_PLACEHOLDER, ProductImage } from '@/entities/product';

type ProductGalleryProps = { name: string; images: string[] };

export const ProductGallery = ({ name, images }: ProductGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = images[selectedIndex] ?? PRODUCT_IMAGE_PLACEHOLDER;
  const selectedAlt = images.length === 0 ? name : `${name}, foto ${selectedIndex + 1} de ${images.length}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
        <ProductImage
          src={selectedImage}
          alt={selectedAlt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <ul className="grid grid-cols-4 gap-2 sm:gap-3">
          {images.map((image, index) => (
            <li key={index}>
              <button
                type="button"
                aria-label={`Ver foto ${index + 1} de ${images.length}`}
                aria-pressed={index === selectedIndex}
                onClick={() => setSelectedIndex(index)}
                className={`relative block aspect-square min-h-11 w-full overflow-hidden rounded-xl bg-gray-100 ring-2 ${index === selectedIndex ? 'ring-brand-500' : 'ring-transparent'}`}
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
