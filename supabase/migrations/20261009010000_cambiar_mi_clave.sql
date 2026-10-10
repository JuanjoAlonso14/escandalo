-- El jugador logueado cambia su propia contraseña.
-- Se actualiza el ingreso (auth.users) y la copia bcrypt de jugadores.password_hash.
-- Solo toca la cuenta de quien está en la sesión: no se puede cambiar la de otro.

create or replace function public.cambiar_mi_clave(p_actual text, p_nueva text)
returns void
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_hash text;
  v_jugador bigint;
  v_nuevo text;
begin
  if v_uid is null then
    raise exception 'Tenés que entrar para cambiar la contraseña' using errcode = '28000';
  end if;
  if nullif(trim(p_actual), '') is null or nullif(trim(p_nueva), '') is null then
    raise exception 'Completá la contraseña actual y la nueva' using errcode = '22023';
  end if;
  if char_length(p_nueva) < 6 then
    raise exception 'La nueva contraseña tiene que tener al menos 6 caracteres' using errcode = '22023';
  end if;
  if char_length(p_nueva) > 72 then
    raise exception 'La contraseña es demasiado larga' using errcode = '22023';
  end if;
  if p_nueva = p_actual then
    raise exception 'Elegí una contraseña distinta a la actual' using errcode = '22023';
  end if;

  select encrypted_password into v_hash from auth.users where id = v_uid;
  if v_hash is null or v_hash is distinct from crypt(p_actual, v_hash) then
    raise exception 'La contraseña actual no coincide' using errcode = '28000';
  end if;

  select jugador_id into v_jugador from public.perfiles where id = v_uid;
  if v_jugador is null then
    raise exception 'No hay un jugador asociado a esta cuenta' using errcode = 'P0002';
  end if;

  v_nuevo := crypt(p_nueva, gen_salt('bf'));
  update auth.users set encrypted_password = v_nuevo, updated_at = now() where id = v_uid;
  update public.jugadores set password_hash = v_nuevo where id = v_jugador;
end $$;

revoke all on function public.cambiar_mi_clave(text, text) from public, anon;
grant execute on function public.cambiar_mi_clave(text, text) to authenticated;
