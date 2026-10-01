-- Lipa na M-Pesa (Daraja STK Push).
-- Keys live only in mpesa_config, which no app user can read; the Edge Functions read it with the
-- service role. Loise sets them from Settings through set_mpesa_config().

create table if not exists public.mpesa_config (
  id integer primary key default 1 check (id = 1),
  env text not null default 'sandbox' check (env in ('sandbox', 'production')),
  type text not null default 'paybill' check (type in ('paybill', 'till')),
  shortcode text,          -- Paybill number, or for a Till the store / head-office number
  till text,               -- Till (Buy Goods) number, only for type = 'till'
  consumer_key text,
  consumer_secret text,
  passkey text,
  callback_token text not null default encode(extensions.gen_random_bytes(16), 'hex'),
  updated_at timestamptz not null default now()
);
alter table public.mpesa_config enable row level security;
revoke all on public.mpesa_config from anon, authenticated;

create table if not exists public.mpesa_payments (
  id uuid primary key default gen_random_uuid(),
  checkout_request_id text unique,
  merchant_request_id text,
  phone text not null,
  amount integer not null check (amount > 0),
  account_ref text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  result_code integer,
  result_desc text,
  mpesa_receipt text,
  paid_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mpesa_payments_created_idx on public.mpesa_payments (created_at desc);
alter table public.mpesa_payments enable row level security;
revoke all on public.mpesa_payments from anon, authenticated;
grant select on public.mpesa_payments to authenticated;
create policy mpesa_payments_select on public.mpesa_payments for select to authenticated
  using ((select public.app_role()) in ('loise', 'sales'));

-- Loise saves the M-Pesa settings. Blank secret fields keep the stored value.
create or replace function public.set_mpesa_config(
  p_env text, p_type text, p_shortcode text, p_till text,
  p_consumer_key text, p_consumer_secret text, p_passkey text
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.app_role() <> 'loise' then raise exception 'Only Loise can change M-Pesa settings'; end if;
  insert into public.mpesa_config (id) values (1) on conflict (id) do nothing;
  update public.mpesa_config set
    env = coalesce(nullif(p_env, ''), env),
    type = coalesce(nullif(p_type, ''), type),
    shortcode = coalesce(nullif(trim(p_shortcode), ''), shortcode),
    till = case when p_type = 'paybill' then null else coalesce(nullif(trim(p_till), ''), till) end,
    consumer_key = coalesce(nullif(trim(p_consumer_key), ''), consumer_key),
    consumer_secret = coalesce(nullif(trim(p_consumer_secret), ''), consumer_secret),
    passkey = coalesce(nullif(trim(p_passkey), ''), passkey),
    updated_at = now()
  where id = 1;
end $$;
revoke all on function public.set_mpesa_config(text, text, text, text, text, text, text) from public, anon;
grant execute on function public.set_mpesa_config(text, text, text, text, text, text, text) to authenticated;

-- What the app may know about the setup (never the secrets themselves)
create or replace function public.mpesa_status() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when public.app_role() not in ('loise', 'sales') then null else coalesce((
    select jsonb_build_object(
      -- test mode falls back to Safaricom's public sandbox shortcode and passkey
      'configured', consumer_key is not null and consumer_secret is not null
                    and (env = 'sandbox' or (shortcode is not null and passkey is not null))
                    and (type = 'paybill' or till is not null),
      'env', env, 'type', type, 'shortcode', shortcode, 'till', till,
      'has_key', consumer_key is not null, 'has_secret', consumer_secret is not null, 'has_passkey', passkey is not null,
      'updated_at', updated_at)
    from public.mpesa_config where id = 1), '{"configured": false}'::jsonb) end
$$;
revoke all on function public.mpesa_status() from public, anon;
grant execute on function public.mpesa_status() to authenticated;
