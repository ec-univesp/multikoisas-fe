'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import TextArea from '@/components/form/input/TextArea';
import type { Category, Product, ProductImageRecord } from '@/entities/product';
import { hasProductFormErrors, validateProductForm } from './validateProductForm';
import { ProductPhotosField, type NewPhoto } from './ProductPhotosField';
import type { PhotoChanges, ProductFormErrors, ProductFormValues } from './types';

const buildInitialFormValues = (product?: Product): ProductFormValues => ({
  name: product?.name ?? '',
  categoryId: product?.categoryId === null || !product ? '' : String(product.categoryId),
  description: product?.longDescription ?? '',
});

type ProductFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  existingProduct?: Product;
  existingPhotos?: readonly ProductImageRecord[];
  categories: readonly Category[];
  onSave: (values: ProductFormValues, photoChanges: PhotoChanges) => Promise<number>;
};

export const ProductFormModal = ({
  isOpen,
  onClose,
  existingProduct,
  existingPhotos = [],
  categories,
  onSave,
}: ProductFormModalProps) => {
  const [values, setValues] = useState<ProductFormValues>(() =>
    buildInitialFormValues(existingProduct),
  );
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<number[]>([]);

  const updateField = (field: keyof ProductFormValues, value: string) =>
    setValues((previousValues) => ({ ...previousValues, [field]: value }));

  const addPhotos = (files: File[]) =>
    setNewPhotos((previousPhotos) => [
      ...previousPhotos,
      ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);

  const togglePhotoRemoval = (photoId: number) =>
    setRemovedPhotoIds((previousIds) =>
      previousIds.includes(photoId) ? previousIds.filter((id) => id !== photoId) : [...previousIds, photoId],
    );

  const discardNewPhoto = (photo: NewPhoto) => {
    URL.revokeObjectURL(photo.previewUrl);
    setNewPhotos((previousPhotos) => previousPhotos.filter((candidate) => candidate !== photo));
  };

  const releasePreviewsAndClose = () => {
    newPhotos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    onClose();
  };

  const closeUnlessSaving = () => {
    if (!isSaving) releasePreviewsAndClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateProductForm(values);
    setErrors(validationErrors);
    if (hasProductFormErrors(validationErrors)) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(values, { removedPhotoIds, newFiles: newPhotos.map((photo) => photo.file) });
      releasePreviewsAndClose();
    } catch {
      setSaveError('Não foi possível salvar o produto. Tente de novo.');
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeUnlessSaving} className="m-4 max-w-[700px]">
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 lg:p-8">
        <h4 className="mb-1 text-2xl font-semibold text-gray-800">
          {existingProduct ? 'Editar produto' : 'Novo produto'}
        </h4>
        <p className="mb-6 text-sm text-gray-500">
          Esses dados aparecem no card e na página de detalhes da vitrine.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="custom-scrollbar flex max-h-[60vh] flex-col gap-5 overflow-y-auto px-1 pb-2">
            <div>
              <Label htmlFor="product-name">Nome do produto</Label>
              <Input
                id="product-name"
                type="text"
                defaultValue={values.name}
                onChange={(event) => updateField('name', event.target.value)}
                error={Boolean(errors.name)}
                hint={errors.name}
                className="text-base"
              />
            </div>

            <div>
              <Label htmlFor="product-category">Categoria</Label>
              <Select
                id="product-category"
                placeholder="Escolha uma categoria"
                options={categories.map((category) => ({
                  value: String(category.id),
                  label: category.name,
                }))}
                defaultValue={values.categoryId}
                onChange={(value) => updateField('categoryId', value)}
                className="text-base"
              />
              {errors.categoryId && (
                <p role="alert" className="mt-1.5 text-xs text-error-500">
                  {errors.categoryId}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="product-description">Descrição</Label>
              <TextArea
                id="product-description"
                placeholder="A primeira linha aparece no card da vitrine"
                rows={6}
                value={values.description}
                onChange={(value) => updateField('description', value)}
                error={Boolean(errors.description)}
                hint={errors.description}
                className="text-base"
              />
            </div>

            <ProductPhotosField
              existingPhotos={existingPhotos}
              removedPhotoIds={removedPhotoIds}
              newPhotos={newPhotos}
              onToggleRemoval={togglePhotoRemoval}
              onAddFiles={addPhotos}
              onDiscardNewPhoto={discardNewPhoto}
            />
          </div>

          {saveError && (
            <p role="alert" className="mt-4 px-1 text-sm text-error-500">
              {saveError}
            </p>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 px-1">
            <Button size="sm" variant="outline" onClick={closeUnlessSaving} disabled={isSaving}>
              Cancelar
            </Button>
            <Button size="sm" type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar produto'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
