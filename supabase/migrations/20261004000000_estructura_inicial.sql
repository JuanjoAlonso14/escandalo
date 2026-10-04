-- Estructura inicial: jugadores, torneos y partidos del sitio de Escándalo.
-- Los datos personales sensibles (cédula, fecha de nacimiento) NO se guardan acá.

create table public.torneos (
  id        text primary key,              -- ej: 'primavera' (se usa en /torneo#id)
  nombre    text not null,
  desde     date not null,
  hasta     date not null,
  lugar     text not null,
  logro     text,                          -- ej: '🏆 Campeones'
  hito      text,                          -- texto para la línea de tiempo
  creado_en timestamptz not null default now()
);

create table public.jugadores (
  slug         text primary key,           -- ej: 'luis-davila' (se usa en /jugador/slug)
  nombre       text not null,
  apodo        text not null,
  foto         text not null,
  numero       integer unique check (numero between 0 and 99),
  nacionalidad text,
  dato         text,
  activo       boolean not null default true,
  creado_en    timestamptz not null default now()
);

create table public.partidos (
  id        bigint generated always as identity primary key,
  torneo_id text not null references public.torneos(id) on delete cascade,
  fecha     date not null,
  fase      text,                          -- ej: 'Semifinal'
  rival     text not null,
  nuestros  integer not null check (nuestros >= 0),
  suyos     integer not null check (suyos >= 0),
  creado_en timestamptz not null default now()
);
create index partidos_torneo_idx on public.partidos (torneo_id, fecha);

-- Seguridad: cualquiera puede LEER (el sitio es público); nadie puede escribir todavía.
-- Más adelante se agregan políticas para que solo un administrador con sesión pueda editar.
alter table public.torneos   enable row level security;
alter table public.jugadores enable row level security;
alter table public.partidos  enable row level security;

create policy "lectura publica" on public.torneos   for select using (true);
create policy "lectura publica" on public.jugadores for select using (true);
create policy "lectura publica" on public.partidos  for select using (true);
