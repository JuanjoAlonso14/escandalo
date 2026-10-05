-- Contenido editable del sitio: equipo, entrenamientos, próximos partidos, historia e hitos.
-- Lectura pública; escritura solo admin. Seed con lo que hoy está en js/data.js.

create table public.equipo (
  id         integer primary key check (id = 1),
  nombre     text not null,
  whatsapp   text not null,
  email      text not null,
  instagram  text not null,
  actualizado_en timestamptz not null default now()
);

create table public.entrenamientos (
  id     bigint generated always as identity primary key,
  dia    text not null,
  hora   text not null,
  lugar  text not null,
  mapa   text,
  orden  integer not null default 0
);

create table public.proximos (
  id     bigint generated always as identity primary key,
  fecha  timestamp not null,           -- sin zona: se muestra tal cual en la cuenta regresiva
  torneo text not null,
  lugar  text not null,
  rival  text,
  fechas text                            -- texto libre, ej: "4, 5 y 6 de diciembre"
);

create table public.historia (
  orden integer primary key,
  texto text not null
);

create table public.hitos (
  id     bigint generated always as identity primary key,
  fecha  date not null,
  icono  text not null default '🥏',
  titulo text not null,
  texto  text not null
);

alter table public.equipo          enable row level security;
alter table public.entrenamientos  enable row level security;
alter table public.proximos        enable row level security;
alter table public.historia        enable row level security;
alter table public.hitos           enable row level security;

create policy "lectura publica" on public.equipo         for select using (true);
create policy "lectura publica" on public.entrenamientos for select using (true);
create policy "lectura publica" on public.proximos       for select using (true);
create policy "lectura publica" on public.historia       for select using (true);
create policy "lectura publica" on public.hitos          for select using (true);

create policy "admin escribe equipo" on public.equipo for all to authenticated
  using (public.es_admin()) with check (public.es_admin());
create policy "admin escribe entrenamientos" on public.entrenamientos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());
create policy "admin escribe proximos" on public.proximos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());
create policy "admin escribe historia" on public.historia for all to authenticated
  using (public.es_admin()) with check (public.es_admin());
create policy "admin escribe hitos" on public.hitos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

insert into public.equipo (id, nombre, whatsapp, email, instagram) values
  (1, 'Escándalo', '59898489298', 'escandaloultimate@gmail.com', 'https://www.instagram.com/escandaloultimate/')
on conflict (id) do nothing;

insert into public.entrenamientos (dia, hora, lugar, mapa, orden)
select * from (values
  ('Martes',  '19:00', 'Brigada de Comunicaciones 1', 'https://maps.app.goo.gl/7HYpu15j2bMttqfC8', 1),
  ('Viernes', '18:30', 'Centro Juvenil Salesiano',    'https://maps.app.goo.gl/UxxXn9xZ1p1vaQXS6', 2),
  ('Domingo', '16:00', 'Facultad de Agronomía',       'https://maps.app.goo.gl/iQH2DWrSgPoB1N3J8', 3)
) as v(dia, hora, lugar, mapa, orden)
where not exists (select 1 from public.entrenamientos);

insert into public.proximos (fecha, torneo, lugar, rival, fechas)
select * from (values
  ('2026-12-04 00:00'::timestamp, 'Copa Oriental 2026', 'Punta del Este, Maldonado', null::text, '4, 5 y 6 de diciembre')
) as v(fecha, torneo, lugar, rival, fechas)
where not exists (select 1 from public.proximos);

insert into public.historia (orden, texto) values
  (1, 'Escándalo nació de las ganas de tener un grupo de amigos que la pase bien jugando al ultimate frisbee.'),
  (2, 'Nuestro nombre y nuestra bomba lo dicen todo: jugamos con intensidad, con energía y con ganas de hacer ruido en cada punto, pero siempre desde el respeto. En el Ultimate no hay árbitros; nos regimos por el espiritu de juego, y eso es lo que queremos que nos represente adentro y afuera de la cancha.'),
  (3, 'En septiembre de 2026 jugamos nuestro primer torneo oficial, la Copa Primavera en Florida. Ganamos los cinco partidos y nos quedamos con el campeonato 🏆. Fue el primer gran paso de un equipo que recién empieza y que ya mira a la Copa Oriental, en diciembre, en Punta del Este.'),
  (4, 'Entrenamos tres veces por semana y la puerta está abierta: no hace falta tener experiencia. Si querés sumarte, escribinos y te prestamos un disco.')
on conflict (orden) do nothing;

insert into public.hitos (fecha, icono, titulo, texto)
select * from (values
  ('2026-04-14'::date, '🥏', 'Primera práctica', 'Un grupo de amigos, un disco y muchas ganas: así arrancó Escándalo.')
) as v(fecha, icono, titulo, texto)
where not exists (select 1 from public.hitos);
