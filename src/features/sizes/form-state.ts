export type SizeOptionFormValues = {
  label: string;
};

export type SizeOptionFormState = {
  message?: string;
  fieldErrors?: Partial<Record<keyof SizeOptionFormValues, string[]>>;
};

export const initialSizeOptionFormState: SizeOptionFormState = {};
