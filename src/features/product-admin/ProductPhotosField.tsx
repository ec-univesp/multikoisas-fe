'use client';

import { useState } from 'react';
import Label from '@/components/form/Label';
import FileInput from '@/components/form/input/FileInput';
import { TrashBinIcon } from '@/icons';
import { PRODUCT_IMAGE_PLACEHOLDER, ProductImage, type ProductImageRecord } from '@/entities/product';

export type NewPhoto = { file: File; previewUrl: string };

type ProductPhotosFieldProps = {
  existingPhotos: readonly ProductImageRecord[];
  removedPhotoIds: readonly number[];
  newPhotos: readonly NewPhoto[];
  onToggleRemoval: (photoId: number) => void;
  onAddFiles: (files: File[]) => void;
  onDiscardNewPhoto: (photo: NewPhoto) => void;
};

type PhotoTile = { key: string; src: string; isMarkedForRemoval: boolean; onToggle: () => void };

const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 1_048_576;

const rejectionOf = (file: File): string | null => {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) return `${file.name}: use JPG, PNG ou WebP.`;
  if (file.size > MAX_PHOTO_BYTES) return `${file.name}: a foto passa de 1 MB.`;
  return null;
};

export const ProductPhotosField = ({
  existingPhotos,
  removedPhotoIds,
  newPhotos,
  onToggleRemoval,
  onAddFiles,
  onDiscardNewPhoto,
}: ProductPhotosFieldProps) => {
  const tiles: PhotoTile[] = [
    ...existingPhotos.map((photo) => ({
      key: `photo-${photo.id}`,
      src: photo.url ?? PRODUCT_IMAGE_PLACEHOLDER,
      isMarkedForRemoval: removedPhotoIds.includes(photo.id),
      onToggle: () => onToggleRemoval(photo.id),
    })),
    ...newPhotos.map((photo) => ({
      key: photo.previewUrl,
      src: photo.previewUrl,
      isMarkedForRemoval: false,
      onToggle: () => onDiscardNewPhoto(photo),
    })),
  ];

  const [rejectionMessages, setRejectionMessages] = useState<string[]>([]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setRejectionMessages(files.flatMap((file) => rejectionOf(file) ?? []));
    onAddFiles(files.filter((file) => rejectionOf(file) === null));
    event.target.value = '';
  };

  return (
    <div>
      <Label htmlFor="product-photos">Fotos</Label>
      <FileInput
        id="product-photos"
        multiple
        accept={ACCEPTED_PHOTO_TYPES.join(',')}
        aria-describedby="product-photos-hint"
        onChange={handleChange}
        className="text-base"
      />
      <p id="product-photos-hint" className="mt-1.5 text-xs text-gray-500">
        JPG, PNG ou WebP, até 1 MB cada.
      </p>
      {rejectionMessages.length > 0 && (
        <div role="alert" className="mt-1.5 text-xs text-error-500">
          {rejectionMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}
      {tiles.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {tiles.map((tile, index) => (
            <li key={tile.key} className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
              <ProductImage
                src={tile.src}
                alt={`Foto ${index + 1}`}
                fill
                sizes="(min-width: 640px) 150px, 33vw"
                className={`object-cover ${tile.isMarkedForRemoval ? 'opacity-30' : ''}`}
              />
              {tile.isMarkedForRemoval ? (
                <button
                  type="button"
                  onClick={tile.onToggle}
                  aria-label={`Desfazer remoção da foto ${index + 1}`}
                  className="absolute inset-x-0 bottom-0 min-h-11 bg-white/90 text-sm font-medium text-gray-700 hover:text-brand-500"
                >
                  Desfazer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={tile.onToggle}
                  aria-label={`Remover foto ${index + 1}`}
                  title="Remover foto"
                  className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-bl-lg bg-white/90 text-gray-600 hover:text-error-500"
                >
                  <TrashBinIcon />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
