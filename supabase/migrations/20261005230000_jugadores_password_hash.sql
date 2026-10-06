-- password_hash vive en jugadores (ya no en jugadores_claves).
-- La columna NO se expone a anon/authenticated. El login sigue siendo Supabase Auth;
-- este hash es la copia de referencia (bcrypt) que sincroniza set_jugador_clave.

alter table public.jugadores
  add column if not exists password_hash text;

-- Traer lo que hubiera en la tabla vieja
update public.jugadores j
set password_hash = c.password_hash
from public.jugadores_claves c
where c.jugador_slug = j.slug
  and (j.password_hash is null or j.password_hash = '');

-- Juanjo y Camila: mismos passwords de siempre, solo el hash (sin texto plano en el repo)
update public.jugadores set password_hash = '$2a$06$w2Njl4raPfc8y4Jr28Tboe9A1ywo.dOEEsVpYa/ZAbxZMZP9E3XjG'
where slug = 'juanjo-alonso';
update public.jugadores set password_hash = '$2a$06$QzbzAtJBDSjBQKQjS9OzQuAY9uGtd1ZeiNNikv1Cy5hP9t5FlL1ZK'
where slug = 'camila-couture';

-- set_jugador_clave escribe en jugadores
create or replace function public.set_jugador_clave(p_slug text, p_password text)
returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_slug is null or nullif(trim(p_password), '') is null then
    raise exception 'Falta slug o contraseña' using errcode = '22023';
  end if;
  if not exists (select 1 from public.jugadores where slug = p_slug) then
    raise exception 'No existe el jugador %', p_slug using errcode = 'P0002';
  end if;
  update public.jugadores
  set password_hash = crypt(p_password, gen_salt('bf'))
  where slug = p_slug;
end $$;
revoke all on function public.set_jugador_clave(text, text) from public, anon, authenticated;
grant execute on function public.set_jugador_clave(text, text) to service_role;

drop table if exists public.jugadores_claves;

-- Que el sitio no pueda leer el hash aunque pida select=*
revoke select (password_hash) on table public.jugadores from anon, authenticated;
