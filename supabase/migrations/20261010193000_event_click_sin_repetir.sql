-- El mismo click (mismo jugador y mismo value) dentro de 5 minutos tampoco se repite.

create or replace function public.event_sin_repetir()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type in ('pageview', 'click') and exists (
    select 1
    from public.event e
    where e.jugador_id = new.jugador_id
      and e.type = new.type
      and e.value is not distinct from new.value
      and e.created_at > now() - interval '5 minutes'
  ) then
    return null;
  end if;
  return new;
end;
$$;

create index if not exists event_click_reciente_idx
  on public.event (jugador_id, value, created_at desc)
  where type = 'click';
