-- Nueva estadística del trackeo: quién de Escándalo la cagó en defensa cuando el rival hace un punto.
-- Puede no haber nadie: en ese caso el punto se cierra sin evento.

alter table public.track_eventos drop constraint if exists track_eventos_tipo_check;
alter table public.track_eventos add constraint track_eventos_tipo_check check (tipo in (
  'gol', 'asistencia', 'defensa',
  'pase_completado', 'pase_errado', 'pase_recibido', 'pase_caido',
  'cagada'
));
