export type ClientFormValues = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  rfc?: string;
  notes?: string;
};

export type ClientFormState = {
  message?: string;
  fieldErrors?: Partial<Record<keyof ClientFormValues, string[]>>;
};

export const initialClientFormState: ClientFormState = {};
