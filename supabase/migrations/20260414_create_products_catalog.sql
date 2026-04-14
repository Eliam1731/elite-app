create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  base_price_amount numeric(12, 2) not null check (base_price_amount >= 0),
  capture_mode text not null check (capture_mode in ('full', 'simple')),
  is_active boolean not null default true,
  notes text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.products (
  name,
  base_price_amount,
  capture_mode,
  is_active,
  notes
)
values
  ('Playera manga corta', 290.00, 'full', true, null),
  ('Playera sin mangas', 290.00, 'full', true, null),
  ('Playera manga larga', 290.00, 'full', true, null),
  ('Playera tipo playa', 290.00, 'full', true, null),
  ('Short', 90.00, 'simple', true, null),
  ('Licra', 0.00, 'full', true, null),
  ('Chamarra', 0.00, 'full', true, null),
  ('Pants', 0.00, 'full', true, null)
on conflict (name) do update
set
  base_price_amount = excluded.base_price_amount,
  capture_mode = excluded.capture_mode,
  is_active = excluded.is_active,
  notes = excluded.notes;

alter table public.quote_items
  add column if not exists product_id uuid null;

alter table public.order_items
  add column if not exists product_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'quote_items_product_id_fkey'
  ) then
    alter table public.quote_items
      add constraint quote_items_product_id_fkey
      foreign key (product_id)
      references public.products(id)
      on delete set null;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_product_id_fkey'
  ) then
    alter table public.order_items
      add constraint order_items_product_id_fkey
      foreign key (product_id)
      references public.products(id)
      on delete set null;
  end if;
end
$$;

create index if not exists quote_items_product_id_idx
  on public.quote_items(product_id);

create index if not exists order_items_product_id_idx
  on public.order_items(product_id);

update public.quote_items qi
set product_id = p.id
from public.products p
where qi.product_id is null
  and qi.description = p.name;

update public.order_items oi
set product_id = p.id
from public.products p
where oi.product_id is null
  and oi.description = p.name;
