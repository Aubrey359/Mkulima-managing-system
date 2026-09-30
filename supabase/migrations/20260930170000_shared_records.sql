-- Shared data for the Mkulima Mdogo Seedlings app (applied to Supabase project "shamba-sokoni").
-- Every record of the app (a sale, a customer, a sowing entry, ...) is one row.
-- coll = which list it belongs to (orders, cust, sowing, ... or _meta for settings/counters)
create table public.records (
  coll text not null,
  id text not null,
  data jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  primary key (coll, id)
);
create index records_updated_at_idx on public.records (updated_at);

create or replace function public.touch_record() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := clock_timestamp();
  new.updated_by := auth.uid();
  return new;
end $$;
create trigger records_touch before insert or update on public.records
  for each row execute function public.touch_record();

-- Role comes from app_metadata, which users cannot change themselves
create or replace function public.app_role() returns text
language sql stable set search_path = '' as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
$$;

alter table public.records enable row level security;
revoke all on public.records from anon;

create policy records_select on public.records for select to authenticated using (
  (select public.app_role()) in ('loise', 'sales')
  or ((select public.app_role()) = 'sowing' and (
    coll in ('sowing', 'inv', 'cat', 'bookings', 'prop', 'orders', 'cust', '_meta')
    or (coll = 'audit' and updated_by = (select auth.uid()))))
);
create policy records_insert on public.records for insert to authenticated with check (
  (select public.app_role()) in ('loise', 'sales')
  or ((select public.app_role()) = 'sowing' and coll in ('sowing', 'audit'))
);
create policy records_update on public.records for update to authenticated using (
  (select public.app_role()) in ('loise', 'sales')
  or ((select public.app_role()) = 'sowing' and coll in ('sowing', 'audit'))
) with check (
  (select public.app_role()) in ('loise', 'sales')
  or ((select public.app_role()) = 'sowing' and coll in ('sowing', 'audit'))
);

-- Change a role's password. Loise may change any role; others only their own.
create or replace function public.set_role_password(target_role text, new_password text) returns void
language plpgsql security definer set search_path = '' as $$
declare caller text := public.app_role();
begin
  if caller = '' then raise exception 'Not signed in'; end if;
  if caller <> 'loise' and caller <> target_role then raise exception 'Not allowed'; end if;
  if length(coalesce(new_password, '')) < 6 then raise exception 'Password must be at least 6 characters'; end if;
  update auth.users
     set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
         raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"must_change": false}'::jsonb,
         updated_at = now()
   where raw_app_meta_data ->> 'role' = target_role;
  if not found then raise exception 'Unknown role'; end if;
end $$;
revoke all on function public.set_role_password(text, text) from public, anon;
grant execute on function public.set_role_password(text, text) to authenticated;

-- Accounts (created separately, not in this file): loise@, sales@ and sowing@mkulima.example.com,
-- each with app_metadata.role set to its role and user_metadata.must_change = true.
