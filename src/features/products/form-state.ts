export type ProductFormValues = {
  name: string;
  base_price_amount: string;
  capture_mode: "simple" | "full";
  notes?: string;
};

export type ProductFormState = {
  message?: string;
  fieldErrors?: Partial<Record<keyof ProductFormValues, string[]>>;
};

export const initialProductFormState: ProductFormState = {};
