export type ProductFormValues = {
  name: string;
  base_price_amount: string;
  is_active: "true" | "false";
  notes?: string;
};

export type ProductFormState = {
  message?: string;
  fieldErrors?: Partial<Record<keyof ProductFormValues, string[]>>;
};

export const initialProductFormState: ProductFormState = {};
