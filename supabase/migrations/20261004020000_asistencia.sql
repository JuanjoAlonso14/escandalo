-- Asistencia a prácticas. Solo pueden verla usuarios con sesión; solo un admin puede modificarla.
-- Una fila en asistencias = esa persona "contaba" para esa práctica (fue = true / faltó = false).
-- Si no hay fila, la práctica no cuenta para esa persona (por ejemplo, todavía no estaba en el equipo).

create table public.practicas (
  id        bigint generated always as identity primary key,
  fecha     date not null unique,
  lugar     text,
  notas     text,
  creado_en timestamptz not null default now()
);

create table public.asistencias (
  practica_id  bigint not null references public.practicas(id) on delete cascade,
  jugador_slug text   not null references public.jugadores(slug) on delete cascade on update cascade,
  presente     boolean not null,
  primary key (practica_id, jugador_slug)
);
create index asistencias_jugador_idx on public.asistencias (jugador_slug);

alter table public.practicas    enable row level security;
alter table public.asistencias  enable row level security;

create policy "ver con sesion" on public.practicas   for select to authenticated using (true);
create policy "ver con sesion" on public.asistencias for select to authenticated using (true);
create policy "admin escribe practicas"   on public.practicas   for all to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "admin escribe asistencias" on public.asistencias for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Crea o actualiza una práctica junto con su asistencia, todo en una sola operación.
-- p_asistencias: [{"slug": "luis-davila", "presente": true}, ...]  (quien no figura, no cuenta)
-- Se ejecuta con los permisos de quien la llama, así que solo funciona para admins.
create function public.guardar_practica(
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
  insert into public.asistencias (practica_id, jugador_slug, presente)
    select v_id, a->>'slug', (a->>'presente')::boolean from jsonb_array_elements(coalesce(p_asistencias, '[]'::jsonb)) a;
  return v_id;
end $$;
revoke all on function public.guardar_practica(bigint, date, text, text, jsonb) from public, anon;
grant execute on function public.guardar_practica(bigint, date, text, text, jsonb) to authenticated;
