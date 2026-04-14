create table if not exists public.size_options (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  code text not null,
  applies_to_capture_mode text not null check (
    applies_to_capture_mode in ('full', 'simple', 'both')
  ),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists size_options_code_key
  on public.size_options(code);

create unique index if not exists size_options_label_key
  on public.size_options(label);

create index if not exists size_options_active_sort_idx
  on public.size_options(is_active desc, sort_order asc, label asc);

insert into public.size_options (label, code, applies_to_capture_mode, sort_order, is_active)
values
  ('4', '4', 'both', 10, true),
  ('6', '6', 'both', 20, true),
  ('8', '8', 'both', 30, true),
  ('10', '10', 'both', 40, true),
  ('12', '12', 'both', 50, true),
  ('14', '14', 'both', 60, true),
  ('16', '16', 'both', 70, true),
  ('XS', 'XS', 'both', 80, true),
  ('S', 'S', 'both', 90, true),
  ('M', 'M', 'both', 100, true),
  ('L', 'L', 'both', 110, true),
  ('XL', 'XL', 'both', 120, true),
  ('2XL', '2XL', 'both', 130, true),
  ('3XL', '3XL', 'both', 140, true),
  ('4XL', '4XL', 'both', 150, true),
  ('5XL', '5XL', 'both', 160, true),
  ('6XL', '6XL', 'both', 170, true)
on conflict (code) do update
set
  label = excluded.label,
  applies_to_capture_mode = excluded.applies_to_capture_mode,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());
