-- Facundo Gonzalez (Facu), camiseta 17. Rol jugador.
-- Solo datos públicos del sitio. Nacionalidad y dato gracioso quedan en blanco: se completan desde el panel.
-- Sus datos personales (cédula, nacimiento, contacto) NO van en una migración: este repositorio es público.

insert into public.jugadores (slug, nombre, apodo, foto, numero, rol)
values (
  'facundo-gonzalez',
  'Facundo Gonzalez',
  'Facu',
  'facundo-gonzalez.webp',
  17,
  'jugador'
)
on conflict (slug) do nothing;
