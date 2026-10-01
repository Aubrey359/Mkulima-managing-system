-- One shared counter per document prefix (RCP, PRP, QUO, ...), so two devices never get the same number.
create table public.counters (
  name text primary key,
  value integer not null
);
alter table public.counters enable row level security;
revoke all on public.counters from anon, authenticated;

-- Hand out the next number. p_min lets a device push the counter past numbers already in use
-- (e.g. ones issued before this counter existed); the counter never goes backwards.
create or replace function public.next_counter(p_name text, p_min integer default 1) returns integer
language plpgsql security definer set search_path = '' as $$
declare v integer;
begin
  if public.app_role() not in ('loise', 'sales') then raise exception 'Not allowed'; end if;
  if p_name !~ '^[A-Z]{2,5}$' then raise exception 'Bad counter name'; end if;
  insert into public.counters as c (name, value) values (p_name, greatest(coalesce(p_min, 1), 1))
  on conflict (name) do update set value = greatest(c.value, coalesce(p_min, 1) - 1) + 1
  returning c.value into v;
  return v;
end $$;
revoke all on function public.next_counter(text, integer) from public, anon;
grant execute on function public.next_counter(text, integer) to authenticated;
