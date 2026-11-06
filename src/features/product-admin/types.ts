export type PurchaseLinkDraft = { key: number; salesChannelId: string; url: string };

export type ProductFormValues = {
  name: string;
  categoryId: string;
  description: string;
  purchaseLinks: PurchaseLinkDraft[];
};

export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;

export type PhotoChanges = { removedPhotoIds: readonly number[]; newFiles: readonly File[] };

export type PurchaseLink = { salesChannelId: number; url: string };
