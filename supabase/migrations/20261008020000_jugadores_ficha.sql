-- Datos internos del plantel, en la misma tabla jugadores.
-- El sitio público entra como anónimo: esas columnas no se pueden leer sin sesión.
-- Un admin las ve y las edita desde el panel (la escritura ya exige es_admin()).

alter table public.jugadores
  add column sexo text check (sexo in ('Mujer', 'Hombre')),
  add column cedula text check (cedula is null or (length(cedula) between 1 and 20)),
  add column nacimiento date,
  add column reglas text check (reglas in ('Estándar', 'Avanzado')),
  add column contacto_nombre text check (contacto_nombre is null or (length(contacto_nombre) between 1 and 80)),
  add column contacto_tel text check (contacto_tel is null or (length(contacto_tel) between 1 and 40)),
  add column cobertura text check (cobertura is null or (length(cobertura) between 1 and 80)),
  add column socio boolean;

revoke select (sexo, cedula, nacimiento, reglas, contacto_nombre, contacto_tel, cobertura, socio)
  on public.jugadores from public, anon;

-- Los datos de cada jugador (cédula, nacimiento, contacto, etc.) NO van en el repo: es público.
-- Se cargan a mano en cada base con supabase/privado/ficha-plantel.sql (carpeta ignorada por git).
