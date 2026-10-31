-- Remote DB had a legacy receipts.image_url NOT NULL column; app inserts use storage_path only.
-- Fresh databases never had that column.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'receipts'
      and column_name = 'image_url'
  ) then
    alter table public.receipts alter column image_url drop not null;
    update public.receipts
    set image_url = storage_path
    where image_url is null and storage_path is not null;
    alter table public.receipts drop column image_url;
  end if;
end $$;

update public.receipts set account_code = 'personal' where account_code is null;
update public.receipts set currency = 'GBP' where currency is null;
update public.receipts set storage_path = coalesce(nullif(storage_path, ''), 'unknown') where storage_path is null;
update public.receipts set status = 'pending' where status is null;

-- Align nullable columns with finance workflow (safe if already NOT NULL).
alter table public.receipts alter column account_code set not null;
alter table public.receipts alter column currency set not null;
alter table public.receipts alter column storage_path set not null;
alter table public.receipts alter column status set not null;
