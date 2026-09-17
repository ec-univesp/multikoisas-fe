import type { StoreSlug } from '@/entities/product';

export type StoreLinkFormValue = {
  id: string;
  store: StoreSlug;
  url: string;
};

export type ProductFormValues = {
  name: string;
  category: string;
  shortDescription: string;
  longDescription: string;
  imageUrl: string;
  storeLinks: StoreLinkFormValue[];
};

export type ProductFormErrors = {
  name?: string;
  category?: string;
  shortDescription?: string;
  longDescription?: string;
  imageUrl?: string;
  storeLinks?: string;
  storeLinkUrls?: Record<number, string>;
};
