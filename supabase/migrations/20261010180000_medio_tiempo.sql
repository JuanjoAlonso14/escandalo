-- Medio tiempo: se marca a 8 goles o con un botón, y el descanso pausa el reloj del partido.

alter table public.track_partidos
  add column medio_en timestamptz,
  add column medio_motivo text check (medio_motivo is null or medio_motivo in ('goles', 'manual')),
  add column descanso_seg integer check (descanso_seg is null or descanso_seg between 60 and 1800),
  add column descanso_inicio timestamptz,
  add column reanudado_en timestamptz;
