-- Jugadores con cuenta pero fuera del roster: entran en /login y ven lo que ve un jugador,
-- pero no tienen carta, no aparecen en el roster, en asistencia ni en caja (activo = false).
-- En el trackeo se los puede sumar a cualquier torneo, como al resto del plantel.
alter table public.jugadores add column cuenta boolean not null default false;

-- anon solo lee columnas públicas: la página de login necesita saber quién tiene cuenta.
grant select (cuenta) on table public.jugadores to anon;

-- Solo datos públicos: sus datos personales NO van en una migración, este repositorio es público.
insert into public.jugadores (slug, nombre, apodo, foto, activo, cuenta, rol) values
  ('catherine-calleas', 'Catherine Calleas', 'Catherine', 'catherine-calleas.webp', false, true, 'jugador'),
  ('guido-giarrusso',   'Guido Giarrusso',   'Guido',     'guido-giarrusso.webp',   false, true, 'jugador'),
  ('gabriella-assis',   'Gabriella Assis',   'Gabriella', 'gabriella-assis.webp',   false, true, 'jugador'),
  ('monica-solorzano',  'Monica Solorzano',  'Monica',    'monica-solorzano.webp',  false, true, 'jugador'),
  ('arturo-laffi',      'Arturo Laffi',      'Arturo',    'arturo-laffi.webp',      false, true, 'jugador')
on conflict (slug) do nothing;
