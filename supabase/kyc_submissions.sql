-- KYC submissions + storage policies (also included in schema.sql).
-- Run in Supabase SQL Editor after profiles exist.
-- Create a private Storage bucket named "kyc" in Dashboard → Storage.

-- Table, triggers, and RLS are in schema.sql. This file is a focused copy for KYC-only deploys.

create table if not exists public.kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  id_type text not null,
  id_document_path text,
  id_document_back_path text,
  selfie_path text not null,
  proof_of_address_path text not null,
  status text not null default 'pending',
  rejection_reason text,
  payload jsonb,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kyc_submissions drop constraint if exists kyc_submissions_id_type_check;
alter table public.kyc_submissions
  add constraint kyc_submissions_id_type_check
  check (id_type in ('passport', 'driving_licence', 'national_id'));

alter table public.kyc_submissions drop constraint if exists kyc_submissions_status_check;
alter table public.kyc_submissions
  add constraint kyc_submissions_status_check
  check (status in ('pending', 'approved', 'rejected'));

create unique index if not exists kyc_submissions_one_pending_per_user
  on public.kyc_submissions (user_id)
  where status = 'pending';

-- Storage policies (bucket must be private, name: kyc)
drop policy if exists "read own or staff kyc" on storage.objects;
create policy "read own or staff kyc" on storage.objects
  for select using (
    bucket_id = 'kyc'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_staff())
  );

drop policy if exists "upload own kyc" on storage.objects;
create policy "upload own kyc" on storage.objects
  for insert with check (
    bucket_id = 'kyc'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "update own kyc" on storage.objects;
create policy "update own kyc" on storage.objects
  for update using (
    bucket_id = 'kyc'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
