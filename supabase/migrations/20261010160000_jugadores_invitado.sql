-- Un jugador cargado desde el roster de un torneo de trackeo.
-- No forma parte del plantel del equipo ni aparece en el sitio.

alter table public.jugadores
  add column invitado boolean not null default false;
