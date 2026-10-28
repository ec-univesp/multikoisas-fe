'use client';

import Label from '@/components/form/Label';
import FileInput from '@/components/form/input/FileInput';
import { TrashBinIcon } from '@/icons';
import { ProductImage } from '@/entities/product';

export type NewPhoto = { file: File; previewUrl: string };

type ProductPhotosFieldProps = {
  newPhotos: readonly NewPhoto[];
  onAddFiles: (files: File[]) => void;
  onDiscardNewPhoto: (photo: NewPhoto) => void;
};

const ACCEPTED_PHOTO_TYPES = 'image/jpeg,image/png,image/webp';

export const ProductPhotosField = ({ newPhotos, onAddFiles, onDiscardNewPhoto }: ProductPhotosFieldProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onAddFiles(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  return (
    <div>
      <Label htmlFor="product-photos">Fotos</Label>
      <FileInput
        id="product-photos"
        multiple
        accept={ACCEPTED_PHOTO_TYPES}
        aria-describedby="product-photos-hint"
        onChange={handleChange}
        className="text-base"
      />
      <p id="product-photos-hint" className="mt-1.5 text-xs text-gray-500">
        JPG, PNG ou WebP, até 1 MB cada.
      </p>
      {newPhotos.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {newPhotos.map((photo, index) => (
            <li key={photo.previewUrl} className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
              <ProductImage
                src={photo.previewUrl}
                alt={`Foto ${index + 1}`}
                fill
                sizes="(min-width: 640px) 150px, 33vw"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => onDiscardNewPhoto(photo)}
                aria-label={`Remover foto ${index + 1}`}
                title="Remover foto"
                className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-bl-lg bg-white/90 text-gray-600 hover:text-error-500"
              >
                <TrashBinIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
