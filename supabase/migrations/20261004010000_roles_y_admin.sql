-- Roles: cada usuario tiene un perfil con rol 'admin' o 'usuario'.
-- Solo un admin puede modificar jugadores, torneos y partidos. Cualquiera puede leerlos.

create table public.perfiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  jugador_slug text references public.jugadores(slug) on delete set null on update cascade,
  rol          text not null default 'usuario' check (rol in ('admin', 'usuario')),
  creado_en    timestamptz not null default now()
);

-- Función auxiliar: ¿el usuario que hace la consulta es admin?
-- (security definer para poder leer perfiles sin entrar en un ciclo de reglas)
create function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'admin');
$$;
revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to anon, authenticated;

alter table public.perfiles enable row level security;
-- Cada uno ve su propio perfil; un admin ve todos. Los perfiles se crean desde el servidor, no desde el sitio.
create policy "ver perfil propio o todos si es admin" on public.perfiles for select
  using (id = auth.uid() or public.es_admin());

-- Escritura solo para admins
create policy "admin escribe jugadores" on public.jugadores for all to authenticated
  using (public.es_admin()) with check (public.es_admin());
create policy "admin escribe torneos" on public.torneos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());
create policy "admin escribe partidos" on public.partidos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());
