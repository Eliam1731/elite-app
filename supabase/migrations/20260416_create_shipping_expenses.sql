create table if not exists public.shipping_expenses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid null references public.orders(id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  expense_date date not null default current_date,
  notes text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists shipping_expenses_expense_date_idx
  on public.shipping_expenses(expense_date desc, created_at desc);

create index if not exists shipping_expenses_order_id_idx
  on public.shipping_expenses(order_id);
