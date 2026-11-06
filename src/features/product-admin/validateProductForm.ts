import type { ProductFormErrors, ProductFormValues, PurchaseLinkDraft } from './types';

const isNonEmptyText = (value: string): boolean => value.trim().length > 0;

const isHttpsUrl = (text: string): boolean => {
  try {
    return new URL(text.trim()).protocol === 'https:';
  } catch {
    return false;
  }
};

const isIncompleteLink = (link: PurchaseLinkDraft) => !isNonEmptyText(link.salesChannelId) || !isHttpsUrl(link.url);

const isRepeatedStore = (link: PurchaseLinkDraft, position: number, purchaseLinks: readonly PurchaseLinkDraft[]) =>
  purchaseLinks.findIndex((candidate) => candidate.salesChannelId === link.salesChannelId) !== position;

export const findInvalidPurchaseLinkKeys = (purchaseLinks: readonly PurchaseLinkDraft[]): number[] => {
  const incompleteLinks = purchaseLinks.filter(isIncompleteLink);
  const invalidLinks = incompleteLinks.length > 0 ? incompleteLinks : purchaseLinks.filter(isRepeatedStore);
  return invalidLinks.map((link) => link.key);
};

const validatePurchaseLinks = (purchaseLinks: readonly PurchaseLinkDraft[]): string | undefined => {
  if (purchaseLinks.some(isIncompleteLink)) return 'Escolha a loja e cole um link que comece com https://.';
  if (purchaseLinks.some(isRepeatedStore)) return 'Cada loja só pode aparecer uma vez.';
  return undefined;
};

export const validateProductForm = (values: ProductFormValues): ProductFormErrors => {
  const errors: ProductFormErrors = {};

  if (!isNonEmptyText(values.name)) errors.name = 'Informe o nome do produto.';
  if (!isNonEmptyText(values.categoryId)) errors.categoryId = 'Escolha a categoria do produto.';
  if (!isNonEmptyText(values.description)) errors.description = 'Informe a descrição do produto.';
  const purchaseLinksError = validatePurchaseLinks(values.purchaseLinks);
  if (purchaseLinksError) errors.purchaseLinks = purchaseLinksError;

  return errors;
};

export const hasProductFormErrors = (errors: ProductFormErrors): boolean =>
  Object.keys(errors).length > 0;
