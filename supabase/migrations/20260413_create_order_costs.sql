create table if not exists public.order_costs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  cost_type text not null check (
    cost_type in (
      'materiales',
      'mano_de_obra',
      'impresion',
      'bordado',
      'envio',
      'extras',
      'otro'
    )
  ),
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  cost_date date not null,
  notes text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists order_costs_order_id_idx
  on public.order_costs(order_id);

create index if not exists order_costs_order_date_idx
  on public.order_costs(order_id, cost_date desc, created_at desc);
