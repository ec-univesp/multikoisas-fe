'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { PRODUCT_IMAGE_PLACEHOLDER } from './types';

type ProductImageProps = Omit<ImageProps, 'src' | 'onError'> & { src: string };

export const ProductImage = ({ src, alt, ...imageProps }: ProductImageProps) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    <Image
      {...imageProps}
      src={failedSrc === src ? PRODUCT_IMAGE_PLACEHOLDER : src}
      alt={alt}
      onError={() => setFailedSrc(src)}
    />
  );
};
