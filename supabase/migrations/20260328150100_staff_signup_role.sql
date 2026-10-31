-- Staff emails get super role on signup (Supabase Auth → Add user for info@nevoluteinc.com).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_role text := 'customer';
begin
  if lower(trim(coalesce(new.email, ''))) in ('info@nevoluteinc.com', 'admin@nevolute.inc') then
    staff_role := 'super';
  end if;

  insert into public.profiles (id, first_name, last_name, email, phone, role, status, kyc_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', 'North Rim'),
    coalesce(new.raw_user_meta_data->>'last_name', 'Staff'),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    staff_role,
    'active',
    'not_started'
  )
  on conflict (id) do update set
    role = excluded.role,
    email = excluded.email,
    updated_at = now()
  where public.profiles.role = 'customer'
    and excluded.role in ('admin', 'super');

  insert into public.accounts (user_id, code, name, currency)
  values
    (new.id, 'personal', 'Personal', 'GBP'),
    (new.id, 'savings', 'Savings', 'GBP'),
    (new.id, 'euro', 'Euro', 'EUR'),
    (new.id, 'usd', 'US Dollar', 'USD')
  on conflict (user_id, code) do nothing;

  return new;
end;
$$;
