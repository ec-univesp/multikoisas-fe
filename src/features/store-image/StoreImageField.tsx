'use client';

import { useEffect, useRef, useState } from 'react';
import FileInput from '@/components/form/input/FileInput';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import {
  removeStoreImage,
  saveStoreImage,
  useStoreSettings,
  type StoreImageType,
} from '@/entities/store-settings';
import { BrandMark } from '@/shared/ui/BrandMark';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_IMAGE_BYTES = 1_048_576;

type ImageMessage = { kind: 'success' | 'failure'; text: string };

const FIELD_COPY = {
  LOGO: {
    current: 'Logo atual',
    preview: 'Prévia da logo nova',
    input: 'Nova logo',
    save: 'Salvar logo',
    saved: 'Logo salva.',
    saveFailed: 'Não foi possível salvar a logo.',
    remove: 'Voltar para a logo padrão',
    removed: 'A vitrine voltou para a logo padrão.',
    removeFailed: 'Não foi possível voltar para a logo padrão.',
  },
  CAPA: {
    current: 'Foto atual',
    preview: 'Prévia da foto nova',
    input: 'Nova foto',
    save: 'Salvar foto',
    saved: 'Foto salva.',
    saveFailed: 'Não foi possível salvar a foto.',
    remove: 'Remover foto',
    removed: 'Foto removida.',
    removeFailed: 'Não foi possível remover a foto.',
  },
} satisfies Record<StoreImageType, Record<string, string>>;

const rejectionOf = (file: File): string | null => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Use uma imagem JPG, PNG, WebP ou SVG.';
  if (file.size > MAX_IMAGE_BYTES) return 'A imagem passa de 1 MB.';
  return null;
};

export const StoreImageField = ({ type }: { type: StoreImageType }) => {
  const { settings } = useStoreSettings();
  const currentUrl = type === 'LOGO' ? settings.logoUrl : settings.photoUrl;
  const copy = FIELD_COPY[type];
  const inputId = `store-image-${type.toLowerCase()}`;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [chosenFile, setChosenFile] = useState<File | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);
  const [imageMessage, setImageMessage] = useState<ImageMessage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const previewUrlRef = useRef<string | null>(null);
  const imageMessageRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (imageMessage?.kind === 'success') imageMessageRef.current?.focus();
  }, [imageMessage]);

  const replacePreview = (nextFile: File | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const nextPreviewUrl = nextFile && URL.createObjectURL(nextFile);
    previewUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
    setChosenFile(nextFile);
  };

  const runImageChange = async (change: () => Promise<unknown>, success: string, failure: string) => {
    setIsSaving(true);
    try {
      await change();
      replacePreview(null);
      setImageMessage({ kind: 'success', text: success });
    } catch {
      setImageMessage({ kind: 'failure', text: failure });
    } finally {
      setIsSaving(false);
    }
  };

  const saveImage = (file: File) => runImageChange(() => saveStoreImage(type, file), copy.saved, copy.saveFailed);

  const removeImage = () => runImageChange(() => removeStoreImage(type), copy.removed, copy.removeFailed);

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
    setImageMessage(null);
    replacePreview(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex min-h-24 items-center justify-center rounded-lg bg-store-navy px-4 py-3">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- object URL preview, next/image does not load blob URLs
          <img src={previewUrl} alt={copy.preview} className="max-h-16 w-auto object-contain" />
        ) : currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- the image can come from any https host, next/image only loads the configured ones
          <img src={currentUrl} alt={copy.current} className="max-h-16 w-auto object-contain" />
        ) : (
          <div role="img" aria-label={copy.current}>
            <BrandMark tone="onDark" />
          </div>
        )}
      </div>
      <div>
        <Label htmlFor={inputId}>{copy.input}</Label>
        <FileInput
          id={inputId}
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          aria-describedby={`${inputId}-hint`}
          onChange={handleChange}
          className="text-base!"
        />
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-gray-500">
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
        <Button disabled={!chosenFile || isSaving} onClick={() => chosenFile && saveImage(chosenFile)}>
          {copy.save}
        </Button>
        {currentUrl && (
          <Button variant="outline" disabled={isSaving} onClick={removeImage}>
            {copy.remove}
          </Button>
        )}
        {imageMessage && (
          <p
            ref={imageMessageRef}
            tabIndex={-1}
            role={imageMessage.kind === 'success' ? 'status' : 'alert'}
            className={`text-sm ${imageMessage.kind === 'success' ? 'text-success-700' : 'text-error-500'}`}
          >
            {imageMessage.text}
          </p>
        )}
      </div>
    </div>
  );
};
