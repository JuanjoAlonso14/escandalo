-- created_at queda como fecha y hora de Uruguay, sin microsegundos ni huso.
-- Es seguro correrla más de una vez: si la columna ya está convertida (como en producción, donde se aplicó a mano
-- antes de versionar esta migración), no toca ningún dato. Convertir dos veces correría las fechas 3 horas.

do $$
declare
  tipo text;
  prec int;
begin
  select data_type, datetime_precision into tipo, prec
  from information_schema.columns
  where table_schema = 'public' and table_name = 'event' and column_name = 'created_at';

  if tipo = 'timestamp with time zone' then
    -- base nueva: las fechas están en UTC y se pasan a hora de Uruguay
    alter table public.event
      alter column created_at type timestamp(0)
      using date_trunc('second', created_at at time zone 'America/Montevideo');
  elsif tipo = 'timestamp without time zone' and coalesce(prec, 6) <> 0 then
    -- ya es hora de Uruguay, solo falta quitar la fracción de segundo
    alter table public.event
      alter column created_at type timestamp(0)
      using date_trunc('second', created_at);
  end if;
end
$$;
