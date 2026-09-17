import type { ProductFormErrors, ProductFormValues } from './types';

const isNonEmptyText = (value: string): boolean => value.trim().length > 0;

const isValidHttpUrl = (value: string): boolean => {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

export const validateProductForm = (values: ProductFormValues): ProductFormErrors => {
  const errors: ProductFormErrors = {};

  if (!isNonEmptyText(values.name)) errors.name = 'Informe o nome do produto.';
  if (!isNonEmptyText(values.category)) errors.category = 'Informe a categoria do produto.';
  if (!isNonEmptyText(values.shortDescription))
    errors.shortDescription = 'Informe a descrição curta exibida no card da vitrine.';
  if (!isNonEmptyText(values.longDescription))
    errors.longDescription = 'Informe a descrição completa exibida na página do produto.';
  if (!isNonEmptyText(values.imageUrl))
    errors.imageUrl = 'Informe o endereço da foto do produto.';

  if (values.storeLinks.length === 0) {
    errors.storeLinks = 'Adicione ao menos uma loja para venda do produto.';
  }

  const storeLinkUrls: Record<number, string> = {};
  values.storeLinks.forEach((storeLink, index) => {
    if (!isValidHttpUrl(storeLink.url)) {
      storeLinkUrls[index] =
        'Informe um endereço (URL) válido, começando com http:// ou https://.';
    }
  });
  if (Object.keys(storeLinkUrls).length > 0) errors.storeLinkUrls = storeLinkUrls;

  return errors;
};

export const hasProductFormErrors = (errors: ProductFormErrors): boolean =>
  Object.keys(errors).length > 0;
