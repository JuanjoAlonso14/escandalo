-- Roxi pasa a ser jugadora del plantel con su carta: Roxio Acosta, camiseta 75.
-- Se actualiza la fila que ya existía (slug 'roxi'), así sigue en el roster de los torneos donde ya estaba.
-- Solo datos públicos: sus datos personales NO van en una migración, este repositorio es público.

update public.jugadores
set slug = 'roxio-acosta', nombre = 'Roxio Acosta', apodo = 'Roxi', foto = 'roxio-acosta.webp', numero = 75, nacionalidad = 'Uruguaya', activo = true
where slug = 'roxi';

insert into public.jugadores (slug, nombre, apodo, foto, numero, nacionalidad, activo, rol)
values ('roxio-acosta', 'Roxio Acosta', 'Roxi', 'roxio-acosta.webp', 75, 'Uruguaya', true, 'jugador')
on conflict (slug) do nothing;
