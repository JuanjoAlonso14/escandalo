-- Por qué se cerró el partido: a 15, o porque lo marcaron a mano.
-- Si después se borra el punto y nadie queda en 15, el de "quince" se vuelve a abrir.

alter table public.track_partidos
  add column cierre text check (cierre is null or cierre in ('quince', 'manual'));
