-- Contraseñas hasheadas de jugadores. NO se exponen por la API pública (ni anon ni authenticated).
-- El login sigue siendo Supabase Auth; esta tabla es la fuente de verdad del hash y la sincroniza el script local.
create extension if not exists pgcrypto;

create table public.jugadores_claves (
  jugador_slug  text primary key references public.jugadores(slug) on delete cascade on update cascade,
  password_hash text not null,
  actualizado_en timestamptz not null default now()
);

alter table public.jugadores_claves enable row level security;
-- Sin políticas de SELECT/INSERT/UPDATE/DELETE para anon/authenticated: nadie del sitio las ve.
-- El service_role (scripts) bypassa RLS.

-- Solo service_role puede setear una clave en texto plano (se guarda hasheada con bcrypt).
create function public.set_jugador_clave(p_slug text, p_password text)
returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_slug is null or nullif(trim(p_password), '') is null then
    raise exception 'Falta slug o contraseña' using errcode = '22023';
  end if;
  if not exists (select 1 from public.jugadores where slug = p_slug) then
    raise exception 'No existe el jugador %', p_slug using errcode = 'P0002';
  end if;
  insert into public.jugadores_claves (jugador_slug, password_hash)
  values (p_slug, crypt(p_password, gen_salt('bf')))
  on conflict (jugador_slug) do update
    set password_hash = crypt(p_password, gen_salt('bf')), actualizado_en = now();
end $$;
revoke all on function public.set_jugador_clave(text, text) from public, anon, authenticated;
grant execute on function public.set_jugador_clave(text, text) to service_role;
