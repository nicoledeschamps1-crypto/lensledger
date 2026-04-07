-- Seed categories for existing users who missed the trigger
-- This finds any user without categories and seeds them

insert into categories (user_id, name, type, icon, color, is_tax_deductible, sort_order)
select u.id, c.name, c.type, c.icon, c.color, c.is_tax_deductible, c.sort_order
from auth.users u
cross join (values
  ('Gear',        'expense', 'camera',    '#f09876', true,  1),
  ('Mileage',     'expense', 'car',       '#6bcb77', true,  2),
  ('Software',    'expense', 'laptop',    '#a78bfa', true,  3),
  ('Home Office', 'expense', 'house',     '#7ba4f7', true,  4),
  ('Props',       'expense', 'palette',   '#f0c75e', true,  5),
  ('Travel',      'expense', 'plane',     '#e88d6d', true,  6),
  ('Meals',       'expense', 'coffee',    '#ec8f95', true,  7),
  ('Insurance',   'expense', 'shield',    '#68a8f0', true,  8),
  ('Marketing',   'expense', 'megaphone', '#d68bf0', true,  9),
  ('Education',   'expense', 'book',      '#8bccf0', true, 10),
  ('Other',       'expense', 'box',       '#9898a8', false, 11),
  ('Photography', 'income',  'money',     '#6bcb77', false,  1),
  ('Retainer',    'income',  'refresh',   '#7ba4f7', false,  2),
  ('Other Income','income',  'cash',      '#f0c75e', false,  3)
) as c(name, type, icon, color, is_tax_deductible, sort_order)
where not exists (
  select 1 from categories cat where cat.user_id = u.id
);

-- Also create profile if missing
insert into profiles (id, full_name, email)
select u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''),
  u.email
from auth.users u
where not exists (
  select 1 from profiles p where p.id = u.id
);
