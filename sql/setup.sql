-- ═══════════════════════════════════════════════════════════════
-- LensLedger — Supabase Database Setup
-- Run this entire script in Supabase SQL Editor (one shot)
-- ═══════════════════════════════════════════════════════════════

-- ─── Profiles ───────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  business_name text,
  email text,
  tax_rate numeric(5,2) default 25.00,
  fiscal_year_start int default 1,
  currency text default 'USD',
  weekly_review_streak int default 0,
  last_review_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "profiles_select" on profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert" on profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update" on profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy "profiles_delete" on profiles
  for delete to authenticated using ((select auth.uid()) = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── Categories ─────────────────────────────────────────────
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text check (type in ('income', 'expense')) not null,
  icon text,
  color text,
  is_tax_deductible boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table categories enable row level security;

create policy "categories_select" on categories
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "categories_insert" on categories
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "categories_update" on categories
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "categories_delete" on categories
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Auto-seed default categories on signup
create or replace function seed_default_categories()
returns trigger as $$
begin
  insert into categories (user_id, name, type, icon, color, is_tax_deductible, sort_order) values
    (new.id, 'Gear',        'expense', '📸', '#f09876', true,  1),
    (new.id, 'Mileage',     'expense', '🚗', '#6bcb77', true,  2),
    (new.id, 'Software',    'expense', '💻', '#a78bfa', true,  3),
    (new.id, 'Home Office', 'expense', '🏠', '#7ba4f7', true,  4),
    (new.id, 'Props',       'expense', '🎨', '#f0c75e', true,  5),
    (new.id, 'Travel',      'expense', '✈️', '#e88d6d', true,  6),
    (new.id, 'Meals',       'expense', '☕', '#ec8f95', true,  7),
    (new.id, 'Insurance',   'expense', '🛡️', '#68a8f0', true,  8),
    (new.id, 'Marketing',   'expense', '📢', '#d68bf0', true,  9),
    (new.id, 'Education',   'expense', '📚', '#8bccf0', true, 10),
    (new.id, 'Other',       'expense', '📦', '#9898a8', false, 11),
    (new.id, 'Photography', 'income',  '💰', '#6bcb77', false,  1),
    (new.id, 'Retainer',    'income',  '🔄', '#7ba4f7', false,  2),
    (new.id, 'Other Income','income',  '💵', '#f0c75e', false,  3);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_user_seed_categories
  after insert on auth.users
  for each row execute function seed_default_categories();

-- ─── Clients ────────────────────────────────────────────────
create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  address text,
  photography_type text,
  status text check (status in ('active', 'lead', 'archived')) default 'active',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table clients enable row level security;

create policy "clients_select" on clients
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "clients_insert" on clients
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "clients_update" on clients
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "clients_delete" on clients
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ─── Invoices ───────────────────────────────────────────────
create table invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  invoice_number text not null,
  status text check (status in ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')) default 'draft',
  issue_date date not null default current_date,
  due_date date,
  paid_date date,
  subtotal numeric(10,2) default 0,
  tax_amount numeric(10,2) default 0,
  total numeric(10,2) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table invoices enable row level security;

create policy "invoices_select" on invoices
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "invoices_insert" on invoices
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "invoices_update" on invoices
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "invoices_delete" on invoices
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ─── Invoice Items ──────────────────────────────────────────
create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade not null,
  description text not null,
  quantity numeric(8,2) default 1,
  unit_price numeric(10,2) not null,
  total numeric(10,2) not null
);

alter table invoice_items enable row level security;

create policy "invoice_items_select" on invoice_items
  for select to authenticated
  using (exists (
    select 1 from invoices
    where invoices.id = invoice_items.invoice_id
    and invoices.user_id = (select auth.uid())
  ));
create policy "invoice_items_insert" on invoice_items
  for insert to authenticated
  with check (exists (
    select 1 from invoices
    where invoices.id = invoice_items.invoice_id
    and invoices.user_id = (select auth.uid())
  ));
create policy "invoice_items_update" on invoice_items
  for update to authenticated
  using (exists (
    select 1 from invoices
    where invoices.id = invoice_items.invoice_id
    and invoices.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from invoices
    where invoices.id = invoice_items.invoice_id
    and invoices.user_id = (select auth.uid())
  ));
create policy "invoice_items_delete" on invoice_items
  for delete to authenticated
  using (exists (
    select 1 from invoices
    where invoices.id = invoice_items.invoice_id
    and invoices.user_id = (select auth.uid())
  ));

-- ─── Transactions ───────────────────────────────────────────
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  invoice_id uuid references invoices(id) on delete set null,
  type text check (type in ('income', 'expense', 'transfer')) not null,
  amount numeric(10,2) not null,
  date date not null default current_date,
  description text,
  merchant text,
  payment_method text,
  is_tax_deductible boolean default false,
  is_business boolean default true,
  business_percentage numeric(5,2) default 100.00,
  plaid_transaction_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table transactions enable row level security;

create policy "transactions_select" on transactions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "transactions_insert" on transactions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "transactions_update" on transactions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "transactions_delete" on transactions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ─── Receipts ───────────────────────────────────────────────
create table receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  transaction_id uuid references transactions(id) on delete set null,
  storage_path text not null,
  filename text,
  file_size int,
  uploaded_at timestamptz default now()
);

alter table receipts enable row level security;

create policy "receipts_select" on receipts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "receipts_insert" on receipts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "receipts_update" on receipts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "receipts_delete" on receipts
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ─── Mileage Log ────────────────────────────────────────────
create table mileage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  start_location text,
  end_location text,
  miles numeric(8,2) not null,
  purpose text,
  client_id uuid references clients(id) on delete set null,
  is_deductible boolean default true,
  irs_rate numeric(5,4) default 0.7000,
  deductible_amount numeric(8,2),
  created_at timestamptz default now()
);

alter table mileage_log enable row level security;

create policy "mileage_select" on mileage_log
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "mileage_insert" on mileage_log
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "mileage_update" on mileage_log
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "mileage_delete" on mileage_log
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Auto-compute deductible amount
create or replace function compute_mileage_deduction()
returns trigger as $$
begin
  new.deductible_amount := round(new.miles * new.irs_rate, 2);
  return new;
end;
$$ language plpgsql;

create or replace trigger mileage_compute_deduction
  before insert or update on mileage_log
  for each row execute function compute_mileage_deduction();

-- ─── Recurring Expenses ─────────────────────────────────────
create table recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  description text not null,
  amount numeric(10,2) not null,
  frequency text check (frequency in ('weekly', 'monthly', 'quarterly', 'annually')) default 'monthly',
  next_due date,
  last_generated date,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table recurring_expenses enable row level security;

create policy "recurring_select" on recurring_expenses
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "recurring_insert" on recurring_expenses
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "recurring_update" on recurring_expenses
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "recurring_delete" on recurring_expenses
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ─── Indexes ────────────────────────────────────────────────
create index idx_transactions_user_date on transactions (user_id, date);
create index idx_transactions_category on transactions (category_id);
create index idx_transactions_plaid on transactions (plaid_transaction_id) where plaid_transaction_id is not null;
create index idx_invoices_user_status on invoices (user_id, status);
create index idx_clients_user on clients (user_id);
create index idx_mileage_user_date on mileage_log (user_id, date);
create index idx_recurring_user on recurring_expenses (user_id);
create index idx_receipts_transaction on receipts (transaction_id);

-- ─── Storage Bucket ─────────────────────────────────────────
-- NOTE: Create a PRIVATE bucket called "receipts" in Supabase Dashboard → Storage
-- Then add these policies in the Storage → Policies section:
--
-- SELECT policy: (bucket_id = 'receipts') AND ((storage.foldername(name))[1] = (select auth.uid())::text)
-- INSERT policy: (bucket_id = 'receipts') AND ((storage.foldername(name))[1] = (select auth.uid())::text)
-- DELETE policy: (bucket_id = 'receipts') AND ((storage.foldername(name))[1] = (select auth.uid())::text)

-- ═══════════════════════════════════════════════════════════════
-- Done! Now go to:
-- 1. Auth → Providers → Enable Google
-- 2. Storage → Create bucket "receipts" (private) → Add policies above
-- ═══════════════════════════════════════════════════════════════
