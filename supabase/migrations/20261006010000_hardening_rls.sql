-- Endurecer RLS/RPC: eventos solo del jugador autenticado; RPCs de escritura solo admin.
-- password_hash sigue sin SELECT para anon/authenticated.

-- 1) event: solo authenticated, y jugador_id = el de su perfil
drop policy if exists "jugadores insertan sus eventos" on public.event;
create policy "jugadores insertan sus eventos" on public.event
  for insert to authenticated
  with check (
    jugador_id = (select p.jugador_id from public.perfiles p where p.id = auth.uid())
  );

revoke insert on public.event from anon;
revoke usage, select on sequence public.event_id_seq from anon;
grant insert on public.event to authenticated;
grant usage, select on sequence public.event_id_seq to authenticated;

-- 2) RPCs: cortar tempr si no es admin (además del RLS de las tablas)
create or replace function public.guardar_practica(
  p_id bigint, p_fecha date, p_lugar text, p_notas text, p_asistencias jsonb
) returns bigint
language plpgsql security invoker as $$
declare v_id bigint;
begin
  if not public.es_admin() then
    raise exception 'Solo administradores' using errcode = '42501';
  end if;
  if p_id is null then
    insert into public.practicas (fecha, lugar, notas) values (p_fecha, p_lugar, p_notas) returning id into v_id;
  else
    update public.practicas set fecha = p_fecha, lugar = p_lugar, notas = p_notas where id = p_id returning id into v_id;
    if v_id is null then raise exception 'La práctica no existe o no tenés permiso' using errcode = 'P0002'; end if;
    delete from public.asistencias where practica_id = v_id;
  end if;
  insert into public.asistencias (practica_id, jugador_id, presente)
    select v_id, (a->>'id')::bigint, (a->>'presente')::boolean
    from jsonb_array_elements(coalesce(p_asistencias, '[]'::jsonb)) a;
  return v_id;
end $$;

create or replace function public.guardar_caja_ingreso(
  p_anio integer, p_mes integer, p_monto numeric,
  p_jugador_id bigint, p_invitado text
) returns void
language plpgsql security invoker as $$
declare v_inv text := nullif(trim(p_invitado), '');
begin
  if not public.es_admin() then
    raise exception 'Solo administradores' using errcode = '42501';
  end if;
  if (p_jugador_id is null) = (v_inv is null) then
    raise exception 'Indicá un jugador o un invitado, no ambos' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 then
    if p_jugador_id is not null then
      delete from public.caja_ingresos where anio = p_anio and mes = p_mes and jugador_id = p_jugador_id;
    else
      delete from public.caja_ingresos where anio = p_anio and mes = p_mes and lower(trim(invitado)) = lower(v_inv);
    end if;
    return;
  end if;
  if p_jugador_id is not null then
    update public.caja_ingresos set monto = p_monto
      where anio = p_anio and mes = p_mes and jugador_id = p_jugador_id;
    if not found then
      insert into public.caja_ingresos (anio, mes, monto, jugador_id)
      values (p_anio, p_mes, p_monto, p_jugador_id);
    end if;
  else
    update public.caja_ingresos set monto = p_monto, invitado = v_inv
      where anio = p_anio and mes = p_mes and lower(trim(invitado)) = lower(v_inv);
    if not found then
      insert into public.caja_ingresos (anio, mes, monto, invitado)
      values (p_anio, p_mes, p_monto, v_inv);
    end if;
  end if;
end $$;

create or replace function public.guardar_caja_egreso(
  p_anio integer, p_mes integer, p_concepto text, p_monto numeric
) returns void
language plpgsql security invoker as $$
declare v_c text := nullif(trim(p_concepto), '');
begin
  if not public.es_admin() then
    raise exception 'Solo administradores' using errcode = '42501';
  end if;
  if v_c is null then raise exception 'Escribí el concepto del egreso' using errcode = '22023'; end if;
  if p_monto is null or p_monto <= 0 then
    delete from public.caja_egresos where anio = p_anio and mes = p_mes and lower(trim(concepto)) = lower(v_c);
    return;
  end if;
  update public.caja_egresos set monto = p_monto, concepto = v_c
    where anio = p_anio and mes = p_mes and lower(trim(concepto)) = lower(v_c);
  if not found then
    insert into public.caja_egresos (anio, mes, concepto, monto)
    values (p_anio, p_mes, v_c, p_monto);
  end if;
end $$;

-- 3) Reafirmar: password_hash no se lee desde el cliente
revoke select (password_hash) on table public.jugadores from anon, authenticated;
