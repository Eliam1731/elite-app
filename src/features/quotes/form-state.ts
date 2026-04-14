export type QuoteItemFormValue = {
  product_id: string;
  description: string;
  quantity: number;
  unit_price_amount: number;
  specifications?: string;
};

export type QuoteFormValues = {
  client_id: string;
  sale_type: "normal" | "factura";
  notes?: string;
  items: QuoteItemFormValue[];
};

export type QuoteFormState = {
  message?: string;
  fieldErrors?: {
    client_id?: string[];
    sale_type?: string[];
    notes?: string[];
    items?: string[];
  };
};

export const initialQuoteFormState: QuoteFormState = {};
