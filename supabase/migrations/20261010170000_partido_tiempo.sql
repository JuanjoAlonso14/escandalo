-- Duración elegida al crear el partido, y el momento en que arranca el reloj total.

alter table public.track_partidos
  add column duracion_min integer check (duracion_min is null or duracion_min between 10 and 180),
  add column inicio_en timestamptz;
