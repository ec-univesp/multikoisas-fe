import type { ProductFormErrors, ProductFormValues } from './types';

const isNonEmptyText = (value: string): boolean => value.trim().length > 0;

export const validateProductForm = (values: ProductFormValues): ProductFormErrors => {
  const errors: ProductFormErrors = {};

  if (!isNonEmptyText(values.name)) errors.name = 'Informe o nome do produto.';
  if (!isNonEmptyText(values.categoryId)) errors.categoryId = 'Escolha a categoria do produto.';
  if (!isNonEmptyText(values.description)) errors.description = 'Informe a descrição do produto.';

  return errors;
};

export const hasProductFormErrors = (errors: ProductFormErrors): boolean =>
  Object.keys(errors).length > 0;
