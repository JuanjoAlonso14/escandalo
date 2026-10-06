-- Reordena jugadores para que id sea la primera columna (el Table Editor sigue el orden físico).

alter table public.asistencias drop constraint if exists asistencias_jugador_id_fkey;
alter table public.caja_ingresos drop constraint if exists caja_ingresos_jugador_id_fkey;
alter table public.event drop constraint if exists event_jugador_id_fkey;
alter table public.perfiles drop constraint if exists perfiles_jugador_id_fkey;

create table public.jugadores_new (
  id             bigint generated always as identity primary key,
  slug           text not null unique,
  nombre         text not null,
  apodo          text not null,
  foto           text not null,
  numero         integer unique check (numero between 0 and 99),
  nacionalidad   text,
  dato           text,
  activo         boolean not null default true,
  creado_en      timestamptz not null default now(),
  password_hash  text
);

insert into public.jugadores_new (
  id, slug, nombre, apodo, foto, numero, nacionalidad, dato, activo, creado_en, password_hash
) overriding system value
select id, slug, nombre, apodo, foto, numero, nacionalidad, dato, activo, creado_en, password_hash
from public.jugadores
order by id;

select setval(
  pg_get_serial_sequence('public.jugadores_new', 'id'),
  coalesce((select max(id) from public.jugadores_new), 1),
  true
);

drop table public.jugadores;
alter table public.jugadores_new rename to jugadores;
alter index if exists jugadores_new_pkey rename to jugadores_pkey;
alter table public.jugadores rename constraint jugadores_new_slug_key to jugadores_slug_key;
alter table public.jugadores rename constraint jugadores_new_numero_key to jugadores_numero_key;
alter table public.jugadores rename constraint jugadores_new_numero_check to jugadores_numero_check;

alter table public.asistencias
  add constraint asistencias_jugador_id_fkey
  foreign key (jugador_id) references public.jugadores(id) on delete cascade;
alter table public.caja_ingresos
  add constraint caja_ingresos_jugador_id_fkey
  foreign key (jugador_id) references public.jugadores(id) on delete cascade;
alter table public.event
  add constraint event_jugador_id_fkey
  foreign key (jugador_id) references public.jugadores(id) on delete cascade;
alter table public.perfiles
  add constraint perfiles_jugador_id_fkey
  foreign key (jugador_id) references public.jugadores(id) on delete set null;

alter table public.jugadores enable row level security;
create policy "lectura publica" on public.jugadores for select using (true);
create policy "admin escribe jugadores" on public.jugadores for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

grant select on public.jugadores to anon, authenticated;
grant all on public.jugadores to service_role;
revoke select (password_hash) on table public.jugadores from anon, authenticated;
