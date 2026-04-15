export type ClientRecord = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  rfc: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessSettingsRecord = {
  id: string;
  business_name: string;
  vat_rate: number;
  default_down_payment_rate: number;
  currency_code: string;
  quote_prefix: string;
  order_prefix: string;
  created_at: string;
  updated_at: string;
};

export type ProductRecord = {
  id: string;
  name: string;
  base_price_amount: number;
  capture_mode: "full" | "simple";
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CanonicalOrderStatus =
  | "borrador"
  | "aprobado"
  | "en_produccion"
  | "listo"
  | "entregado"
  | "cancelado";

export type LegacyOrderStatus =
  | "new"
  | "in_production"
  | "ready"
  | "delivered"
  | "cancelled";

export type OrderStatusRecord = CanonicalOrderStatus | LegacyOrderStatus;

export type QuoteItemRecord = {
  id: string;
  quote_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price_amount: number;
  line_subtotal_amount: number;
  specifications: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type QuoteRecord = {
  id: string;
  folio: string;
  client_id: string;
  sale_type: "normal" | "factura";
  status: "draft" | "sent" | "approved" | "rejected";
  subtotal_amount: number;
  vat_amount: number;
  total_amount: number;
  down_payment_rate: number;
  suggested_down_payment_amount: number;
  notes: string | null;
  sent_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
};

export type QuoteListRecord = QuoteRecord & {
  clients: {
    name: string;
    phone: string;
  } | null;
};

export type QuoteDetailRecord = QuoteRecord & {
  clients: ClientRecord | null;
  quote_items: QuoteItemRecord[];
};

export type OrderItemRecord = {
  id: string;
  order_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price_amount: number;
  line_subtotal_amount: number;
  specifications: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type OrderItemWithProductRecord = OrderItemRecord & {
  product: ProductRecord | null;
};

export type OrderRecord = {
  id: string;
  folio: string;
  quote_id: string;
  client_id: string;
  sale_type: "normal" | "factura";
  status: OrderStatusRecord;
  subtotal_amount: number;
  vat_amount: number;
  total_amount: number;
  down_payment_rate: number;
  expected_down_payment_amount: number;
  production_notes: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderDetailRecord = OrderRecord & {
  clients: ClientRecord | null;
  order_items: OrderItemWithProductRecord[];
  quotes: QuoteRecord | null;
};

export type OrderListRecord = OrderRecord & {
  clients: {
    name: string;
    phone: string;
  } | null;
};

export type PaymentRecord = {
  id: string;
  order_id: string;
  client_id: string;
  payment_type: "down_payment" | "partial" | "final";
  amount: number;
  payment_date: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ShippingExpenseRecord = {
  id: string;
  order_id: string | null;
  amount: number;
  expense_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SizeOptionRecord = {
  id: string;
  label: string;
  sort_order?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SizeTableRowRecord = {
  id: string;
  size_table_id: string;
  order_item_id: string | null;
  piece_index: number | null;
  product_name: string | null;
  capture_mode: "full" | "simple" | null;
  player_name: string | null;
  number: string;
  size: string;
  silhouette: string | null;
  neck_type: string | null;
  has_sleeves: boolean | null;
  has_cuffs: boolean | null;
  specifications: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SizeTableRecord = {
  id: string;
  order_id: string;
  client_id: string;
  title: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  size_table_rows: SizeTableRowRecord[];
};

export type ClientSizePresetRecord = {
  id: string;
  client_id: string;
  name: string;
  number: string;
  size: string;
  silhouette: string | null;
  neck_type: string | null;
  sleeves: string | null;
  cuffs: string | null;
  specifications: string | null;
  created_at: string;
  updated_at: string;
};
