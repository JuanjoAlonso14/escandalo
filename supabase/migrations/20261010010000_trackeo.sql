-- Trackeo de torneos y partidos. Solo un admin puede ver o escribir.
-- No toca los torneos públicos del calendario: esto es el registro de la cancha.

create table public.track_torneos (
  id        bigint generated always as identity primary key,
  nombre    text not null check (length(trim(nombre)) between 1 and 80),
  lugar     text check (lugar is null or length(lugar) <= 80),
  desde     date,
  hasta     date,
  creado_en timestamptz not null default now()
);

create table public.track_roster (
  torneo_id  bigint not null references public.track_torneos(id) on delete cascade,
  jugador_id bigint not null references public.jugadores(id) on delete cascade,
  juega      boolean not null default true,
  primary key (torneo_id, jugador_id)
);

create table public.track_partidos (
  id            bigint generated always as identity primary key,
  torneo_id     bigint not null references public.track_torneos(id) on delete cascade,
  rival         text not null check (length(trim(rival)) between 1 and 80),
  fase          text not null default 'Grupos' check (fase in ('Grupos', 'Pre-cuartos', 'Cuartos', 'Semifinal', 'Final', 'Amistoso')),
  estado        text not null default 'abierto' check (estado in ('abierto', 'finalizado')),
  creado_en     timestamptz not null default now(),
  finalizado_en timestamptz
);
create index track_partidos_torneo_idx on public.track_partidos (torneo_id, creado_en);

create table public.track_puntos (
  id           bigint generated always as identity primary key,
  partido_id   bigint not null references public.track_partidos(id) on delete cascade,
  nro          integer not null check (nro > 0),
  lado         text not null check (lado in ('ataque', 'defensa')),
  resultado    text check (resultado is null or resultado in ('favor', 'contra')),
  duracion_seg integer check (duracion_seg is null or duracion_seg >= 0),
  iniciado_en  timestamptz not null default now(),
  cerrado_en   timestamptz,
  unique (partido_id, nro)
);
create index track_puntos_partido_idx on public.track_puntos (partido_id, nro);

create table public.track_linea (
  punto_id   bigint not null references public.track_puntos(id) on delete cascade,
  jugador_id bigint not null references public.jugadores(id) on delete cascade,
  primary key (punto_id, jugador_id)
);

create table public.track_eventos (
  id         bigint generated always as identity primary key,
  punto_id   bigint not null references public.track_puntos(id) on delete cascade,
  jugador_id bigint not null references public.jugadores(id) on delete cascade,
  tipo       text not null check (tipo in (
    'gol', 'asistencia', 'defensa',
    'pase_completado', 'pase_errado', 'pase_recibido', 'pase_caido'
  )),
  creado_en  timestamptz not null default now()
);
create index track_eventos_punto_idx on public.track_eventos (punto_id, id);

alter table public.track_torneos  enable row level security;
alter table public.track_roster   enable row level security;
alter table public.track_partidos enable row level security;
alter table public.track_puntos   enable row level security;
alter table public.track_linea    enable row level security;
alter table public.track_eventos  enable row level security;

create policy "track admin" on public.track_torneos  for all to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "track admin" on public.track_roster   for all to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "track admin" on public.track_partidos for all to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "track admin" on public.track_puntos   for all to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "track admin" on public.track_linea    for all to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "track admin" on public.track_eventos  for all to authenticated using (public.es_admin()) with check (public.es_admin());

revoke all on table public.track_torneos, public.track_roster, public.track_partidos,
  public.track_puntos, public.track_linea, public.track_eventos from public, anon;
grant select, insert, update, delete on table public.track_torneos, public.track_roster, public.track_partidos,
  public.track_puntos, public.track_linea, public.track_eventos to authenticated;

grant usage, select on sequence public.track_torneos_id_seq, public.track_partidos_id_seq,
  public.track_puntos_id_seq, public.track_eventos_id_seq to authenticated;
