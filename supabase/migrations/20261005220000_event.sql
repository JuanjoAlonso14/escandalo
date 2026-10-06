-- Eventos de uso del sitio: visitas, clicks, etc.
-- jugador_id = slug del jugador con sesión (null si es visitante anónimo).
-- Cualquiera puede insertar; solo un admin puede leer.

create table public.event (
  id          bigint generated always as identity primary key,
  jugador_id  text not null references public.jugadores(slug) on delete cascade on update cascade,
  type        text not null check (length(trim(type)) > 0),
  value       text,
  created_at  timestamptz not null default now()
);
create index event_created_at_idx on public.event (created_at desc);
create index event_type_idx on public.event (type, created_at desc);
create index event_jugador_idx on public.event (jugador_id, created_at desc);

alter table public.event enable row level security;

create policy "jugadores insertan sus eventos" on public.event
  for insert to anon, authenticated
  with check (jugador_id is not null);

create policy "admin lee eventos" on public.event
  for select to authenticated
  using (public.es_admin());

grant insert on public.event to anon, authenticated;
grant select on public.event to authenticated;
-- Identity: sin esto el insert desde anon falla (parece RLS)
grant usage, select on sequence public.event_id_seq to anon, authenticated;
