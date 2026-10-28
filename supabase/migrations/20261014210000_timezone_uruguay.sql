-- timestamptz se guarda en UTC. Esta opción solo cambia cómo se muestra
-- en las sesiones nuevas: hora de Uruguay (UTC−3), en todas las tablas.
alter database postgres set timezone to 'America/Montevideo';
