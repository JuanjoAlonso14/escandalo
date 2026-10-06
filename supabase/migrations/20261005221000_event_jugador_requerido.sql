-- Solo eventos de jugadores logueados: jugador_id obligatorio.
delete from public.event where jugador_id is null;
alter table public.event alter column jugador_id set not null;
alter table public.event drop constraint if exists event_jugador_id_fkey;
alter table public.event
  add constraint event_jugador_id_fkey
  foreign key (jugador_id) references public.jugadores(slug)
  on delete cascade on update cascade;

drop policy if exists "cualquiera inserta eventos" on public.event;
drop policy if exists "jugadores insertan sus eventos" on public.event;
create policy "jugadores insertan sus eventos" on public.event
  for insert to anon, authenticated
  with check (jugador_id is not null);
