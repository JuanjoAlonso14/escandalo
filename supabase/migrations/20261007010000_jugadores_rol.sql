-- El rol vive en el jugador: 'jugador' o 'admin'.
-- Admins: Juanjo Alonso, Camila Couture, Santiago Rodriguez y Matilde Rodriguez.
-- es_admin() lee jugadores.rol (la sesión sigue entrando por perfiles).

alter table public.jugadores
  add column if not exists rol text not null default 'jugador';

alter table public.jugadores drop constraint if exists jugadores_rol_check;
alter table public.jugadores
  add constraint jugadores_rol_check check (rol in ('jugador', 'admin'));

update public.jugadores set rol = 'jugador' where rol is distinct from 'admin';
update public.jugadores set rol = 'admin'
  where slug in ('juanjo-alonso', 'camila-couture', 'santiago-rodriguez', 'matilde-rodriguez');

-- perfiles.rol queda alineado (antes decía 'usuario')
alter table public.perfiles drop constraint if exists perfiles_rol_check;
update public.perfiles set rol = 'jugador' where rol = 'usuario' or rol is null;
alter table public.perfiles alter column rol set default 'jugador';
alter table public.perfiles
  add constraint perfiles_rol_check check (rol in ('jugador', 'admin'));

update public.perfiles p
  set rol = j.rol
  from public.jugadores j
  where p.jugador_id = j.id;

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.perfiles p
    join public.jugadores j on j.id = p.jugador_id
    where p.id = auth.uid() and j.rol = 'admin'
  );
$$;
revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to anon, authenticated;
