-- jugadores pasa a tener id autogenerado como PK; slug queda único (URLs / login email).

-- 1) id en jugadores (único hasta que pase a ser PK)
alter table public.jugadores
  add column id bigint generated always as identity;
alter table public.jugadores
  add constraint jugadores_id_key unique (id);

-- 2) perfiles → jugador_id
alter table public.perfiles add column if not exists jugador_id bigint;
update public.perfiles p
set jugador_id = j.id
from public.jugadores j
where p.jugador_slug = j.slug and p.jugador_id is null;
alter table public.perfiles drop constraint if exists perfiles_jugador_slug_fkey;
alter table public.perfiles drop column if exists jugador_slug;
alter table public.perfiles
  drop constraint if exists perfiles_jugador_id_fkey,
  add constraint perfiles_jugador_id_fkey
    foreign key (jugador_id) references public.jugadores(id) on delete set null;

-- 3) asistencias → jugador_id
alter table public.asistencias add column if not exists jugador_id bigint;
update public.asistencias a
set jugador_id = j.id
from public.jugadores j
where a.jugador_slug = j.slug and a.jugador_id is null;
alter table public.asistencias drop constraint if exists asistencias_pkey;
alter table public.asistencias drop constraint if exists asistencias_jugador_slug_fkey;
drop index if exists asistencias_jugador_idx;
alter table public.asistencias drop column if exists jugador_slug;
alter table public.asistencias alter column jugador_id set not null;
alter table public.asistencias
  add primary key (practica_id, jugador_id);
alter table public.asistencias
  drop constraint if exists asistencias_jugador_id_fkey,
  add constraint asistencias_jugador_id_fkey
    foreign key (jugador_id) references public.jugadores(id) on delete cascade;
create index asistencias_jugador_idx on public.asistencias (jugador_id);

-- 4) caja_ingresos → jugador_id
alter table public.caja_ingresos add column if not exists jugador_id bigint;
update public.caja_ingresos c
set jugador_id = j.id
from public.jugadores j
where c.jugador_slug = j.slug and c.jugador_id is null;
drop index if exists caja_ingresos_jugador_uidx;
alter table public.caja_ingresos drop constraint if exists caja_ingresos_jugador_slug_fkey;
alter table public.caja_ingresos drop constraint if exists caja_ingresos_quien;
alter table public.caja_ingresos drop column if exists jugador_slug;
alter table public.caja_ingresos
  add constraint caja_ingresos_quien check (
    (jugador_id is not null and invitado is null) or
    (jugador_id is null and invitado is not null and length(trim(invitado)) > 0)
  );
alter table public.caja_ingresos
  drop constraint if exists caja_ingresos_jugador_id_fkey,
  add constraint caja_ingresos_jugador_id_fkey
    foreign key (jugador_id) references public.jugadores(id) on delete cascade;
create unique index caja_ingresos_jugador_uidx
  on public.caja_ingresos (anio, mes, jugador_id) where jugador_id is not null;

-- 5) event.jugador_id era slug (text) → bigint
drop policy if exists "jugadores insertan sus eventos" on public.event;
alter table public.event add column jugador_id_new bigint;
update public.event e
set jugador_id_new = j.id
from public.jugadores j
where e.jugador_id = j.slug;
delete from public.event where jugador_id_new is null;
alter table public.event drop constraint if exists event_jugador_id_fkey;
drop index if exists event_jugador_idx;
alter table public.event drop column jugador_id;
alter table public.event rename column jugador_id_new to jugador_id;
alter table public.event alter column jugador_id set not null;
alter table public.event
  add constraint event_jugador_id_fkey
    foreign key (jugador_id) references public.jugadores(id) on delete cascade;
create index event_jugador_idx on public.event (jugador_id, created_at desc);
create policy "jugadores insertan sus eventos" on public.event
  for insert to anon, authenticated
  with check (jugador_id is not null);

-- 6) Cambiar PK de jugadores: slug → id
alter table public.jugadores drop constraint if exists jugadores_pkey;
alter table public.jugadores add primary key (id);
alter table public.jugadores drop constraint if exists jugadores_id_unique;
alter table public.jugadores add constraint jugadores_slug_unique unique (slug);

-- 7) RPCs actualizados
create or replace function public.guardar_practica(
  p_id bigint, p_fecha date, p_lugar text, p_notas text, p_asistencias jsonb
) returns bigint
language plpgsql security invoker as $$
declare v_id bigint;
begin
  if p_id is null then
    insert into public.practicas (fecha, lugar, notas) values (p_fecha, p_lugar, p_notas) returning id into v_id;
  else
    update public.practicas set fecha = p_fecha, lugar = p_lugar, notas = p_notas where id = p_id returning id into v_id;
    if v_id is null then raise exception 'La práctica no existe o no tenés permiso' using errcode = 'P0002'; end if;
    delete from public.asistencias where practica_id = v_id;
  end if;
  -- p_asistencias: [{"id": 1, "presente": true}, ...]
  insert into public.asistencias (practica_id, jugador_id, presente)
    select v_id, (a->>'id')::bigint, (a->>'presente')::boolean
    from jsonb_array_elements(coalesce(p_asistencias, '[]'::jsonb)) a;
  return v_id;
end $$;

drop function if exists public.guardar_caja_ingreso(integer, integer, numeric, text, text);
create function public.guardar_caja_ingreso(
  p_anio integer, p_mes integer, p_monto numeric,
  p_jugador_id bigint, p_invitado text
) returns void
language plpgsql security invoker as $$
declare v_inv text := nullif(trim(p_invitado), '');
begin
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
revoke all on function public.guardar_caja_ingreso(integer, integer, numeric, bigint, text) from public, anon;
grant execute on function public.guardar_caja_ingreso(integer, integer, numeric, bigint, text) to authenticated;

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
