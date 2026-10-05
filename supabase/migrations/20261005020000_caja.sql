-- Caja del equipo: ingresos (aportes de jugadores/invitados) y egresos (cancha, etc.).
-- Solo usuarios con sesión pueden verla; solo un admin puede modificarla.

create table public.caja_ingresos (
  id           bigint generated always as identity primary key,
  anio         integer not null check (anio between 2020 and 2100),
  mes          integer not null check (mes between 1 and 12),
  monto        numeric(12, 2) not null check (monto > 0),
  jugador_slug text references public.jugadores(slug) on delete cascade on update cascade,
  invitado     text,
  creado_en    timestamptz not null default now(),
  constraint caja_ingresos_quien check (
    (jugador_slug is not null and invitado is null) or
    (jugador_slug is null and invitado is not null and length(trim(invitado)) > 0)
  )
);
create unique index caja_ingresos_jugador_uidx
  on public.caja_ingresos (anio, mes, jugador_slug) where jugador_slug is not null;
create unique index caja_ingresos_invitado_uidx
  on public.caja_ingresos (anio, mes, lower(trim(invitado))) where invitado is not null;

create table public.caja_egresos (
  id        bigint generated always as identity primary key,
  anio      integer not null check (anio between 2020 and 2100),
  mes       integer not null check (mes between 1 and 12),
  concepto  text not null check (length(trim(concepto)) > 0),
  monto     numeric(12, 2) not null check (monto > 0),
  creado_en timestamptz not null default now()
);
create unique index caja_egresos_concepto_uidx
  on public.caja_egresos (anio, mes, lower(trim(concepto)));

alter table public.caja_ingresos enable row level security;
alter table public.caja_egresos  enable row level security;

create policy "ver con sesion" on public.caja_ingresos for select to authenticated using (true);
create policy "ver con sesion" on public.caja_egresos  for select to authenticated using (true);
create policy "admin escribe ingresos" on public.caja_ingresos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());
create policy "admin escribe egresos" on public.caja_egresos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- Upsert / borrar un aporte. p_monto null o <= 0 borra la celda.
create function public.guardar_caja_ingreso(
  p_anio integer, p_mes integer, p_monto numeric,
  p_jugador_slug text, p_invitado text
) returns void
language plpgsql security invoker as $$
declare v_inv text := nullif(trim(p_invitado), '');
begin
  if (p_jugador_slug is null) = (v_inv is null) then
    raise exception 'Indicá un jugador o un invitado, no ambos' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 then
    if p_jugador_slug is not null then
      delete from public.caja_ingresos where anio = p_anio and mes = p_mes and jugador_slug = p_jugador_slug;
    else
      delete from public.caja_ingresos where anio = p_anio and mes = p_mes and lower(trim(invitado)) = lower(v_inv);
    end if;
    return;
  end if;
  if p_jugador_slug is not null then
    update public.caja_ingresos set monto = p_monto
      where anio = p_anio and mes = p_mes and jugador_slug = p_jugador_slug;
    if not found then
      insert into public.caja_ingresos (anio, mes, monto, jugador_slug)
      values (p_anio, p_mes, p_monto, p_jugador_slug);
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
revoke all on function public.guardar_caja_ingreso(integer, integer, numeric, text, text) from public, anon;
grant execute on function public.guardar_caja_ingreso(integer, integer, numeric, text, text) to authenticated;

create function public.guardar_caja_egreso(
  p_anio integer, p_mes integer, p_concepto text, p_monto numeric
) returns void
language plpgsql security invoker as $$
declare v_c text := nullif(trim(p_concepto), '');
begin
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
revoke all on function public.guardar_caja_egreso(integer, integer, text, numeric) from public, anon;
grant execute on function public.guardar_caja_egreso(integer, integer, text, numeric) to authenticated;

-- Seed 2026 (mayo–septiembre) según la planilla del equipo. Solo si la tabla está vacía.
insert into public.caja_egresos (anio, mes, concepto, monto)
select * from (values
  (2026, 5, 'Cancha', 5000), (2026, 6, 'Cancha', 5000), (2026, 7, 'Cancha', 5000),
  (2026, 8, 'Cancha', 5000), (2026, 9, 'Cancha', 5000)
) as v(anio, mes, concepto, monto)
where not exists (select 1 from public.caja_egresos);

-- Jugadores del roster (montos tipicos de la planilla). Totales mes: 5500, 6500, 4300, 3550, 4400.
insert into public.caja_ingresos (anio, mes, monto, jugador_slug)
select * from (values
  -- mayo 400
  (2026, 5, 400::numeric, 'camila-couture'), (2026, 5, 400, 'matilde-rodriguez'), (2026, 5, 400, 'sofia-rodriguez'),
  (2026, 5, 400, 'julieta-noguez'), (2026, 5, 400, 'ainara-rodriguez'), (2026, 5, 400, 'santiago-rodriguez'),
  (2026, 5, 400, 'juanjo-alonso'), (2026, 5, 400, 'leandro-rodriguez'), (2026, 5, 400, 'thiago-elizalde'),
  (2026, 5, 400, 'nicolas-cabana'), (2026, 5, 400, 'sebastian-migdal'),
  -- junio 400
  (2026, 6, 400, 'camila-couture'), (2026, 6, 400, 'matilde-rodriguez'), (2026, 6, 400, 'sofia-rodriguez'),
  (2026, 6, 400, 'julieta-noguez'), (2026, 6, 400, 'ainara-rodriguez'), (2026, 6, 400, 'santiago-rodriguez'),
  (2026, 6, 400, 'juanjo-alonso'), (2026, 6, 400, 'leandro-rodriguez'), (2026, 6, 400, 'thiago-elizalde'),
  (2026, 6, 400, 'nicolas-cabana'), (2026, 6, 400, 'sebastian-migdal'),
  -- julio 300
  (2026, 7, 300, 'camila-couture'), (2026, 7, 300, 'matilde-rodriguez'), (2026, 7, 300, 'sofia-rodriguez'),
  (2026, 7, 300, 'julieta-noguez'), (2026, 7, 300, 'ainara-rodriguez'), (2026, 7, 300, 'santiago-rodriguez'),
  (2026, 7, 300, 'juanjo-alonso'), (2026, 7, 300, 'leandro-rodriguez'), (2026, 7, 300, 'thiago-elizalde'),
  (2026, 7, 300, 'nicolas-cabana'), (2026, 7, 300, 'sebastian-migdal'),
  -- agosto 300
  (2026, 8, 300, 'camila-couture'), (2026, 8, 300, 'matilde-rodriguez'), (2026, 8, 300, 'sofia-rodriguez'),
  (2026, 8, 300, 'julieta-noguez'), (2026, 8, 300, 'ainara-rodriguez'), (2026, 8, 300, 'santiago-rodriguez'),
  (2026, 8, 300, 'juanjo-alonso'), (2026, 8, 300, 'leandro-rodriguez'), (2026, 8, 300, 'thiago-elizalde'),
  (2026, 8, 300, 'nicolas-cabana'), (2026, 8, 300, 'sebastian-migdal'),
  -- septiembre 300
  (2026, 9, 300, 'camila-couture'), (2026, 9, 300, 'matilde-rodriguez'), (2026, 9, 300, 'sofia-rodriguez'),
  (2026, 9, 300, 'julieta-noguez'), (2026, 9, 300, 'ainara-rodriguez'), (2026, 9, 300, 'santiago-rodriguez'),
  (2026, 9, 300, 'juanjo-alonso'), (2026, 9, 300, 'leandro-rodriguez'), (2026, 9, 300, 'thiago-elizalde'),
  (2026, 9, 300, 'nicolas-cabana'), (2026, 9, 300, 'sebastian-migdal')
) as v(anio, mes, monto, jugador_slug)
where not exists (select 1 from public.caja_ingresos);

-- Invitados (completan los totales de la planilla: 5500 / 6500 / 4300 / 3550 / 4400)
insert into public.caja_ingresos (anio, mes, monto, invitado)
select * from (values
  (2026, 5, 150::numeric, 'Fabri'), (2026, 5, 400, 'Tonga'), (2026, 5, 300, 'Ally'), (2026, 5, 250, 'Marcos'),
  (2026, 6, 400, 'Fabri'), (2026, 6, 400, 'Tonga'), (2026, 6, 400, 'Ally'), (2026, 6, 400, 'Marcos'),
  (2026, 6, 300, 'Marce'), (2026, 6, 200, 'Agus'),
  (2026, 7, 400, 'Fabri'), (2026, 7, 300, 'Tonga'), (2026, 7, 300, 'Ally'),
  (2026, 8, 250, 'Pilu'),
  (2026, 9, 400, 'Fabri'), (2026, 9, 400, 'Tonga'), (2026, 9, 300, 'Ally')
) as v(anio, mes, monto, invitado)
where not exists (select 1 from public.caja_ingresos where invitado is not null);
