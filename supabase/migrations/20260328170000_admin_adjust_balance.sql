-- Staff fund/defund: updates accounts.balance, ledger row, and triggers email on transactions INSERT.
create or replace function public.admin_adjust_balance(
  p_user_id uuid,
  p_account_code text,
  p_delta numeric,
  p_label text default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
  v_category text;
  v_name text;
  v_id text;
begin
  if not public.is_staff() then
    raise exception 'Not authorized';
  end if;

  if p_delta = 0 then
    raise exception 'Amount must be non-zero';
  end if;

  if p_account_code not in ('personal', 'savings', 'euro', 'usd') then
    raise exception 'Invalid account';
  end if;

  if not exists (
    select 1 from public.profiles where id = p_user_id and role = 'customer'
  ) then
    raise exception 'Customer profile not found';
  end if;

  v_balance := public.apply_account_delta(p_user_id, p_account_code, p_delta);

  if p_delta > 0 then
    v_category := 'Top up';
    v_name := coalesce(nullif(trim(p_label), ''), 'Funds added by North Rim Inc');
  else
    v_category := 'Withdrawal';
    v_name := coalesce(nullif(trim(p_label), ''), 'Funds removed by North Rim Inc');
  end if;

  v_id := 'admin-' || replace(gen_random_uuid()::text, '-', '');

  insert into public.transactions (
    id, user_id, account_id, name, category, amount, date, status, method
  ) values (
    v_id,
    p_user_id,
    p_account_code,
    v_name,
    v_category,
    p_delta,
    current_date,
    'approved',
    'Admin'
  );

  return v_balance;
end;
$$;

grant execute on function public.admin_adjust_balance(uuid, text, numeric, text) to authenticated;
