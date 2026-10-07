-- Maximiliano Lois (Maxi), camiseta 3. Rol jugador.

insert into public.jugadores (slug, nombre, apodo, foto, numero, nacionalidad, dato, rol)
values (
  'maximiliano-lois',
  'Maximiliano Lois',
  'Maxi',
  'maximiliano-lois.webp',
  3,
  'Uruguaya',
  'Llegó con la 3 y ya está corriendo.',
  'jugador'
)
on conflict (slug) do nothing;
