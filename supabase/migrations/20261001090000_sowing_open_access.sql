-- Sowing Team signs in with one tap (no password for workers). The app signs in with a fixed
-- credential, so this account is effectively open: limit it to sowing-related data only
-- (no customers, no sales orders) and stop its password from being changed.
alter policy records_select on public.records using (
  (select public.app_role()) in ('loise', 'sales')
  or ((select public.app_role()) = 'sowing' and (
    coll in ('sowing', 'inv', 'cat', 'bookings', 'prop', '_meta')
    or (coll = 'audit' and updated_by = (select auth.uid()))))
);

-- The fixed credential the app uses (see SOWING_OPEN_PW in assets/js/11-login.js)
update auth.users
   set encrypted_password = extensions.crypt('mkulima-sowing-open', extensions.gen_salt('bf')),
       raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"must_change": false}'::jsonb,
       updated_at = now()
 where raw_app_meta_data ->> 'role' = 'sowing';

create or replace function public.set_role_password(target_role text, new_password text) returns void
language plpgsql security definer set search_path = '' as $$
declare caller text := public.app_role();
begin
  if caller = '' then raise exception 'Not signed in'; end if;
  if target_role = 'sowing' then raise exception 'Sowing Team signs in without a password'; end if;
  if caller <> 'loise' and caller <> target_role then raise exception 'Not allowed'; end if;
  if length(coalesce(new_password, '')) < 6 then raise exception 'Password must be at least 6 characters'; end if;
  update auth.users
     set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
         raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"must_change": false}'::jsonb,
         updated_at = now()
   where raw_app_meta_data ->> 'role' = target_role;
  if not found then raise exception 'Unknown role'; end if;
end $$;
