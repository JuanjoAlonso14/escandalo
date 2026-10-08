-- Un revoke por columna no alcanza: anon tiene select de toda la tabla.
-- Se lo sacamos y le devolvemos solo lo que muestra el sitio público.

revoke select on table public.jugadores from anon;
grant select (
  id, slug, nombre, apodo, foto, numero, nacionalidad, dato, activo, creado_en, rol
) on table public.jugadores to anon;
