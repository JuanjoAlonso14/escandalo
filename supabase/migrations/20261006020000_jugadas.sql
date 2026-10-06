-- Jugadas del equipo (pizarra táctica). Las ve cualquiera con sesión; solo un admin puede crear, editar o borrar.
-- datos: { fichas: [{ id, tipo, etiqueta }], pasos: [{ pos: { id: { x, y } } }] }  (posiciones de 0 a 1)

create table public.jugadas (
  id             bigint generated always as identity primary key,
  nombre         text not null check (length(trim(nombre)) > 0 and length(nombre) <= 80),
  descripcion    text check (descripcion is null or length(descripcion) <= 600),
  datos          jsonb not null default '{"fichas": [], "pasos": [{"pos": {}}]}'::jsonb,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint jugadas_datos_forma check (
    jsonb_typeof(datos -> 'fichas') = 'array' and jsonb_typeof(datos -> 'pasos') = 'array'
  )
);
create unique index jugadas_nombre_uidx on public.jugadas (lower(trim(nombre)));

alter table public.jugadas enable row level security;
create policy "ver con sesion" on public.jugadas for select to authenticated using (true);
create policy "admin escribe jugadas" on public.jugadas for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create or replace function public.jugadas_tocar() returns trigger
language plpgsql as $$
begin new.actualizado_en = now(); return new; end $$;

create trigger jugadas_actualizado
  before update on public.jugadas
  for each row execute function public.jugadas_tocar();
