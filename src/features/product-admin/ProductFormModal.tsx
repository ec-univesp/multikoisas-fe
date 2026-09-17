'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import type { Product } from '@/entities/product';
import { StoreLinksField, createEmptyStoreLink } from './StoreLinksField';
import { createSlugFromName } from './createSlugFromName';
import { hasProductFormErrors, validateProductForm } from './validateProductForm';
import type { ProductFormErrors, ProductFormValues } from './types';

const buildInitialFormValues = (product?: Product): ProductFormValues => ({
  name: product?.name ?? '',
  category: product?.category ?? '',
  shortDescription: product?.shortDescription ?? '',
  longDescription: product?.longDescription ?? '',
  imageUrl: product?.images[0] ?? '',
  storeLinks: product
    ? product.storeLinks.map((storeLink) => ({ id: crypto.randomUUID(), ...storeLink }))
    : [createEmptyStoreLink()],
});

const buildProductFromFormValues = (
  values: ProductFormValues,
  existingProduct: Product | undefined,
  existingSlugs: readonly string[],
): Product => ({
  slug: existingProduct?.slug ?? createSlugFromName(values.name, existingSlugs),
  name: values.name.trim(),
  category: values.category.trim(),
  shortDescription: values.shortDescription.trim(),
  longDescription: values.longDescription.trim(),
  images: [values.imageUrl.trim()],
  storeLinks: values.storeLinks.map(({ store, url }) => ({ store, url: url.trim() })),
});

type ProductFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  existingProduct?: Product;
  existingSlugs: readonly string[];
  onSave: (product: Product) => void;
};

export const ProductFormModal = ({
  isOpen,
  onClose,
  existingProduct,
  existingSlugs,
  onSave,
}: ProductFormModalProps) => {
  const [values, setValues] = useState<ProductFormValues>(() =>
    buildInitialFormValues(existingProduct),
  );
  const [errors, setErrors] = useState<ProductFormErrors>({});

  const updateField = <FieldName extends keyof ProductFormValues>(
    field: FieldName,
    value: ProductFormValues[FieldName],
  ) => setValues((previousValues) => ({ ...previousValues, [field]: value }));

  const resetAndClose = () => {
    setValues(buildInitialFormValues(existingProduct));
    setErrors({});
    onClose();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateProductForm(values);
    setErrors(validationErrors);
    if (hasProductFormErrors(validationErrors)) return;

    onSave(buildProductFromFormValues(values, existingProduct, existingSlugs));
    resetAndClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} className="m-4 max-w-[700px]">
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
              <Input
                id="product-category"
                type="text"
                defaultValue={values.category}
                onChange={(event) => updateField('category', event.target.value)}
                error={Boolean(errors.category)}
                hint={errors.category}
                className="text-base"
              />
            </div>

            <div>
              <Label htmlFor="product-image">Endereço da foto</Label>
              <Input
                id="product-image"
                type="text"
                placeholder="/products/nome-do-produto.svg"
                defaultValue={values.imageUrl}
                onChange={(event) => updateField('imageUrl', event.target.value)}
                error={Boolean(errors.imageUrl)}
                hint={errors.imageUrl}
                className="text-base"
              />
            </div>

            <div>
              <Label htmlFor="product-short-description">
                Descrição curta (aparece no card da vitrine)
              </Label>
              <TextArea
                id="product-short-description"
                placeholder="Frase curta que resume o produto"
                rows={2}
                value={values.shortDescription}
                onChange={(value) => updateField('shortDescription', value)}
                error={Boolean(errors.shortDescription)}
                hint={errors.shortDescription}
                className="text-base"
              />
            </div>

            <div>
              <Label htmlFor="product-long-description">
                Descrição completa (aparece na página do produto)
              </Label>
              <TextArea
                id="product-long-description"
                placeholder="Descrição detalhada do produto"
                rows={4}
                value={values.longDescription}
                onChange={(value) => updateField('longDescription', value)}
                error={Boolean(errors.longDescription)}
                hint={errors.longDescription}
                className="text-base"
              />
            </div>

            <StoreLinksField
              storeLinks={values.storeLinks}
              onChange={(storeLinks) => updateField('storeLinks', storeLinks)}
              generalError={errors.storeLinks}
              urlErrors={errors.storeLinkUrls}
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 px-1">
            <Button size="sm" variant="outline" onClick={resetAndClose}>
              Cancelar
            </Button>
            <Button size="sm" type="submit">
              Salvar produto
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
