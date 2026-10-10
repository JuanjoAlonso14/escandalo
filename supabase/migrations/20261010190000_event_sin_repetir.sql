-- Una visita repetida (refresco) del mismo jugador a la misma página, dentro de 5 minutos, no genera otra fila.

create or replace function public.event_sin_repetir()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type = 'pageview' and exists (
    select 1
    from public.event e
    where e.jugador_id = new.jugador_id
      and e.type = 'pageview'
      and e.value is not distinct from new.value
      and e.created_at > now() - interval '5 minutes'
  ) then
    return null;
  end if;
  return new;
end;
$$;

revoke all on function public.event_sin_repetir() from public, anon, authenticated;

create trigger event_sin_repetir
  before insert on public.event
  for each row
  execute function public.event_sin_repetir();

create index event_pageview_reciente_idx
  on public.event (jugador_id, value, created_at desc)
  where type = 'pageview';
