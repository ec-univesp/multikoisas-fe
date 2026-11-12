'use client';

import { useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Checkbox from '@/components/form/input/Checkbox';
import TextArea from '@/components/form/input/TextArea';
import type { Category, Product, ProductImageRecord } from '@/entities/product';
import type { SalesChannel } from '@/entities/sales-channel';
import { findInvalidPurchaseLinkKeys, hasProductFormErrors, validateProductForm } from './validateProductForm';
import { ProductPhotosField, type NewPhoto } from './ProductPhotosField';
import { PurchaseLinksField } from './PurchaseLinksField';
import type { PhotoChanges, ProductFormErrors, ProductFormValues, PurchaseLink, PurchaseLinkDraft } from './types';

const isSameFile = (first: File, second: File) =>
  first.name === second.name && first.size === second.size && first.lastModified === second.lastModified;

const revokeAll = (previewUrls: Set<string>) => {
  previewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
  previewUrls.clear();
};

const buildInitialFormValues = (
  product: Product | undefined,
  purchaseLinks: readonly PurchaseLink[],
): ProductFormValues => ({
  name: product?.name ?? '',
  categoryIds: product?.categories.map((category) => String(category.id)) ?? [],
  description: product?.longDescription ?? '',
  purchaseLinks: purchaseLinks.map((link, index) => ({
    key: index,
    salesChannelId: String(link.salesChannelId),
    url: link.url,
  })),
});

type ProductFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  existingProduct?: Product;
  existingPhotos?: readonly ProductImageRecord[] | null;
  existingPurchaseLinks?: readonly PurchaseLink[];
  categories: readonly Category[];
  salesChannels: readonly SalesChannel[];
  onSave: (values: ProductFormValues, photoChanges: PhotoChanges) => Promise<number>;
};

export const ProductFormModal = ({
  isOpen,
  onClose,
  existingProduct,
  existingPhotos = [],
  existingPurchaseLinks = [],
  categories,
  salesChannels,
  onSave,
}: ProductFormModalProps) => {
  const [values, setValues] = useState<ProductFormValues>(() =>
    buildInitialFormValues(existingProduct, existingPurchaseLinks),
  );
  const nextPurchaseLinkKeyRef = useRef(existingPurchaseLinks.length);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<number[]>([]);
  const [failedPhotoCount, setFailedPhotoCount] = useState(0);
  const previewUrlsRef = useRef(new Set<string>());

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => revokeAll(previewUrls);
  }, []);

  const updateField = (field: 'name' | 'description', value: string) =>
    setValues((previousValues) => ({ ...previousValues, [field]: value }));

  const toggleCategory = (categoryId: string, isChecked: boolean) =>
    setValues((previousValues) => ({
      ...previousValues,
      categoryIds: isChecked
        ? [...previousValues.categoryIds, categoryId]
        : previousValues.categoryIds.filter((selectedId) => selectedId !== categoryId),
    }));

  const updatePurchaseLinks = (update: (purchaseLinks: PurchaseLinkDraft[]) => PurchaseLinkDraft[]) =>
    setValues((previousValues) => ({ ...previousValues, purchaseLinks: update(previousValues.purchaseLinks) }));

  const addPurchaseLink = () => {
    const key = nextPurchaseLinkKeyRef.current++;
    updatePurchaseLinks((purchaseLinks) => [...purchaseLinks, { key, salesChannelId: '', url: '' }]);
  };

  const changePurchaseLink = (key: number, changes: Partial<PurchaseLinkDraft>) =>
    updatePurchaseLinks((purchaseLinks) =>
      purchaseLinks.map((purchaseLink) => (purchaseLink.key === key ? { ...purchaseLink, ...changes } : purchaseLink)),
    );

  const removePurchaseLink = (key: number) =>
    updatePurchaseLinks((purchaseLinks) => purchaseLinks.filter((purchaseLink) => purchaseLink.key !== key));

  const addPhotos = (files: File[]) => {
    const unseenFiles = files.filter((file) => !newPhotos.some((photo) => isSameFile(photo.file, file)));
    const addedPhotos = unseenFiles.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    addedPhotos.forEach((photo) => previewUrlsRef.current.add(photo.previewUrl));
    setNewPhotos((previousPhotos) => [...previousPhotos, ...addedPhotos]);
  };

  const togglePhotoRemoval = (photoId: number) =>
    setRemovedPhotoIds((previousIds) =>
      previousIds.includes(photoId) ? previousIds.filter((id) => id !== photoId) : [...previousIds, photoId],
    );

  const discardNewPhoto = (photo: NewPhoto) => {
    URL.revokeObjectURL(photo.previewUrl);
    previewUrlsRef.current.delete(photo.previewUrl);
    setNewPhotos((previousPhotos) => previousPhotos.filter((candidate) => candidate !== photo));
  };

  const releasePreviewsAndClose = () => {
    revokeAll(previewUrlsRef.current);
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
      const failedCount = await onSave(values, { removedPhotoIds, newFiles: newPhotos.map((photo) => photo.file) });
      if (failedCount === 0) {
        releasePreviewsAndClose();
        return;
      }
      setFailedPhotoCount(failedCount);
      setIsSaving(false);
    } catch {
      setSaveError('Não foi possível salvar o produto. Tente de novo.');
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeUnlessSaving} className="m-4 max-w-[700px]">
      <div className="relative no-scrollbar w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 lg:p-8">
        <h4 className="mb-1 text-2xl font-semibold text-gray-800">
          {existingProduct ? 'Editar produto' : 'Novo produto'}
        </h4>
        <p className="mb-6 text-sm text-gray-500">Esses dados aparecem no card e na página de detalhes da vitrine.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="no-scrollbar flex max-h-[60vh] flex-col gap-5 overflow-y-auto px-1 pb-2">
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

            <fieldset aria-describedby={errors.categoryIds ? 'product-categories-error' : undefined}>
              <legend className="mb-1.5 block text-sm font-medium text-gray-700">Categorias</legend>
              <div className="flex flex-wrap gap-x-6">
                {categories.map((category) => (
                  <Checkbox
                    key={category.id}
                    id={`product-category-${category.id}`}
                    label={category.name}
                    checked={values.categoryIds.includes(String(category.id))}
                    onChange={(isChecked) => toggleCategory(String(category.id), isChecked)}
                  />
                ))}
              </div>
              {errors.categoryIds && (
                <p id="product-categories-error" role="alert" className="mt-1.5 text-xs text-error-500">
                  {errors.categoryIds}
                </p>
              )}
            </fieldset>

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

            <PurchaseLinksField
              purchaseLinks={values.purchaseLinks}
              salesChannels={salesChannels}
              error={errors.purchaseLinks}
              invalidRowKeys={errors.purchaseLinks ? findInvalidPurchaseLinkKeys(values.purchaseLinks) : []}
              disabled={isSaving || failedPhotoCount > 0}
              onAdd={addPurchaseLink}
              onChange={changePurchaseLink}
              onRemove={removePurchaseLink}
            />

            <ProductPhotosField
              existingPhotos={existingPhotos}
              removedPhotoIds={removedPhotoIds}
              newPhotos={newPhotos}
              onToggleRemoval={togglePhotoRemoval}
              onAddFiles={addPhotos}
              onDiscardNewPhoto={discardNewPhoto}
              disabled={isSaving || failedPhotoCount > 0}
            />
          </div>

          {failedPhotoCount > 0 && (
            <p role="alert" className="mt-4 px-1 text-sm text-error-500">
              Produto salvo, mas {failedPhotoCount} foto(s) não foram atualizadas. Tente de novo pelo Editar.
            </p>
          )}

          {saveError && (
            <p role="alert" className="mt-4 px-1 text-sm text-error-500">
              {saveError}
            </p>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 px-1">
            <Button size="sm" variant="outline" onClick={closeUnlessSaving} disabled={isSaving}>
              {failedPhotoCount > 0 ? 'Fechar' : 'Cancelar'}
            </Button>
            <Button size="sm" type="submit" disabled={isSaving || failedPhotoCount > 0}>
              {isSaving ? 'Salvando...' : 'Salvar produto'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
