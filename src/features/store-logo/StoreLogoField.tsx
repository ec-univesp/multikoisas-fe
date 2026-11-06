'use client';

import { useEffect, useRef, useState } from 'react';
import FileInput from '@/components/form/input/FileInput';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { BrandMark } from '@/shared/ui/BrandMark';

const ACCEPTED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_LOGO_BYTES = 1_048_576;

const rejectionOf = (file: File): string | null => {
  if (!ACCEPTED_LOGO_TYPES.includes(file.type)) return 'Use uma imagem JPG, PNG, WebP ou SVG.';
  if (file.size > MAX_LOGO_BYTES) return 'A imagem passa de 1 MB.';
  return null;
};

export const StoreLogoField = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const replacePreview = (nextPreviewUrl: string | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
  };

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const rejection = rejectionOf(file);
    setRejectionMessage(rejection);
    if (rejection) return;
    replacePreview(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-4">
      <div className="flex min-h-24 items-center justify-center rounded-lg bg-store-navy px-4 py-3">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- object URL preview, next/image does not load blob URLs
          <img src={previewUrl} alt="Prévia da logo nova" className="max-h-16 w-auto object-contain" />
        ) : (
          <div role="img" aria-label="Logo atual">
            <BrandMark tone="onDark" />
          </div>
        )}
      </div>
      <div>
        <Label htmlFor="store-logo">Nova logo</Label>
        <FileInput
          id="store-logo"
          accept={ACCEPTED_LOGO_TYPES.join(',')}
          aria-describedby="store-logo-hint"
          onChange={handleChange}
          className="text-base!"
        />
        <p id="store-logo-hint" className="mt-1.5 text-xs text-gray-500">
          JPG, PNG, WebP ou SVG, até 1 MB.
        </p>
        {rejectionMessage && (
          <p role="alert" className="mt-1.5 text-xs text-error-500">
            {rejectionMessage}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {previewUrl && (
          <Button variant="outline" onClick={() => replacePreview(null)}>
            Descartar
          </Button>
        )}
        <Button disabled aria-describedby="store-logo-save-unavailable">
          Salvar logo
        </Button>
        <p id="store-logo-save-unavailable" className="text-sm text-gray-500">
          Salvar a logo ainda não está disponível: a API não guarda as configurações da loja.
        </p>
      </div>
    </div>
  );
};
