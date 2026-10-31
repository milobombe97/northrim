-- Remote project was missing admin_set_profile_status (soft delete / suspend).
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.admin_set_profile_status(p_user_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'Not authorized';
  end if;
  if p_status not in ('active', 'suspended', 'deleted') then
    raise exception 'Invalid status';
  end if;

  update public.profiles
  set status = p_status, updated_at = now()
  where id = p_user_id
    and role = 'customer';

  if not found then
    raise exception 'Customer profile not found';
  end if;
end;
$$;

grant execute on function public.admin_set_profile_status(uuid, text) to authenticated;

-- PostgREST schema cache (hosted Supabase refreshes automatically after DDL).
notify pgrst, 'reload schema';
