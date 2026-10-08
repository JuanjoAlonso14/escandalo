-- PDFs de prácticas y ejercicios. El bucket es privado: solo un admin puede leerlos.
-- Se suben con la clave de servicio (scripts/subir-recursos.js), no desde el sitio.

insert into storage.buckets (id, name, public)
values ('recursos', 'recursos', false)
on conflict (id) do update set public = false;

drop policy if exists "recursos lectura logueados" on storage.objects;
drop policy if exists "recursos lectura admins" on storage.objects;
create policy "recursos lectura admins"
on storage.objects for select
to authenticated
using (bucket_id = 'recursos' and public.es_admin());
