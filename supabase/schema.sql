-- Run this file in the Supabase SQL editor.
-- Tables used by the frontend:
-- 1) orders
-- 2) feedback
-- 3) customers
-- 4) notifications

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id text primary key,
  customer_name text not null,
  phone text not null,
  address text not null,
  delivery_area text not null,
  order_notes text,
  payment_method text not null,
  status text not null default 'Pending',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  subtotal numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  items jsonb not null default '[]'::jsonb
);

create table if not exists public.feedback (
  id text primary key,
  name text not null,
  role text,
  rating integer not null check (rating >= 1 and rating <= 5),
  text text not null,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.feedback alter column approved set default true;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  address text,
  delivery_area text,
  total_orders integer not null default 1,
  lifetime_value numeric(12,2) not null default 0,
  last_order_id text,
  last_order_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id text primary key,
  type text not null default 'order',
  title text not null,
  message text not null,
  order_id text references public.orders(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_feedback_created_at on public.feedback(created_at desc);
create index if not exists idx_customers_last_order on public.customers(last_order_at desc);
create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);
create index if not exists idx_notifications_is_read on public.notifications(is_read);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.orders to anon, authenticated;
grant select, insert, update, delete on table public.feedback to anon, authenticated;
grant select, insert, update, delete on table public.customers to anon, authenticated;
grant select, insert, update, delete on table public.notifications to anon, authenticated;

alter table public.orders enable row level security;
alter table public.feedback enable row level security;
alter table public.customers enable row level security;
alter table public.notifications enable row level security;

-- Orders: public checkout can insert; admin (authenticated) can read/manage.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_insert_public'
  ) then
    create policy orders_insert_public on public.orders
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_select_auth'
  ) then
    create policy orders_select_auth on public.orders
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_update_auth'
  ) then
    create policy orders_update_auth on public.orders
      for update
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_delete_auth'
  ) then
    create policy orders_delete_auth on public.orders
      for delete
      to authenticated
      using (true);
  end if;
end $$;

-- Feedback: submissions are live by default; admin can still manage all reviews.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'feedback' and policyname = 'feedback_insert_public'
  ) then
    create policy feedback_insert_public on public.feedback
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'feedback' and policyname = 'feedback_select_public_approved'
  ) then
    create policy feedback_select_public_approved on public.feedback
      for select
      to anon
      using (approved = true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'feedback' and policyname = 'feedback_select_auth'
  ) then
    create policy feedback_select_auth on public.feedback
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'feedback' and policyname = 'feedback_update_auth'
  ) then
    create policy feedback_update_auth on public.feedback
      for update
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'feedback' and policyname = 'feedback_delete_auth'
  ) then
    create policy feedback_delete_auth on public.feedback
      for delete
      to authenticated
      using (true);
  end if;
end $$;

-- Customers: checkout can insert customer snapshots; admin can read/manage.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'customers' and policyname = 'customers_insert_public'
  ) then
    create policy customers_insert_public on public.customers
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'customers' and policyname = 'customers_select_auth'
  ) then
    create policy customers_select_auth on public.customers
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'customers' and policyname = 'customers_update_auth'
  ) then
    create policy customers_update_auth on public.customers
      for update
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'customers' and policyname = 'customers_delete_auth'
  ) then
    create policy customers_delete_auth on public.customers
      for delete
      to authenticated
      using (true);
  end if;
end $$;

-- Notifications: checkout can insert order notifications; admin can read/manage.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'notifications_insert_public'
  ) then
    create policy notifications_insert_public on public.notifications
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'notifications_select_auth'
  ) then
    create policy notifications_select_auth on public.notifications
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'notifications_update_auth'
  ) then
    create policy notifications_update_auth on public.notifications
      for update
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'notifications_delete_auth'
  ) then
    create policy notifications_delete_auth on public.notifications
      for delete
      to authenticated
      using (true);
  end if;
end $$;
