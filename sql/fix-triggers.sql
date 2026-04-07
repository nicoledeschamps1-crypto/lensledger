-- Fix: Drop and recreate user signup triggers
-- The original triggers may have failed. This script fixes them.

-- Drop existing triggers
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_user_seed_categories on auth.users;

-- Drop existing functions
drop function if exists handle_new_user();
drop function if exists seed_default_categories();

-- Recreate: single combined function that handles both profile + categories
create or replace function handle_new_user()
returns trigger as $$
begin
  -- Create profile (ignore if already exists)
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.email
  )
  on conflict (id) do nothing;

  -- Seed default categories (ignore if already exist)
  insert into public.categories (user_id, name, type, icon, color, is_tax_deductible, sort_order) values
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
exception
  when others then
    -- Don't let trigger errors block user signup
    raise warning 'handle_new_user error: %', sqlerrm;
    return new;
end;
$$ language plpgsql security definer;

-- Create single trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
