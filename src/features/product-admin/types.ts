export type ProductFormValues = {
  name: string;
  categoryId: string;
  description: string;
};

export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;
