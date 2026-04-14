alter table public.size_options
  add column if not exists is_active boolean not null default true;

update public.size_options
set
  label = coalesce(nullif(trim(label), ''), trim(code)),
  updated_at = timezone('utc', now())
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'size_options'
    and column_name = 'code'
);

drop index if exists public.size_options_code_key;
drop index if exists public.size_options_label_key;
drop index if exists public.size_options_active_sort_idx;

create unique index if not exists size_options_label_key
  on public.size_options(label);

create index if not exists size_options_active_label_idx
  on public.size_options(is_active desc, label asc);

alter table public.size_options
  drop column if exists code,
  drop column if exists applies_to_capture_mode,
  drop column if exists sort_order;

update public.products
set
  capture_mode = 'simple',
  updated_at = timezone('utc', now())
where lower(trim(name)) in ('short', 'licra', 'pants');
