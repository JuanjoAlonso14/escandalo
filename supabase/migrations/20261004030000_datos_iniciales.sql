-- Datos iniciales públicos: torneos, jugadores y partidos que ya muestra el sitio.
-- Se pueden aplicar más de una vez sin duplicar nada. Los cambios posteriores se hacen desde el panel de administración.
-- NO incluye datos privados (asistencia, contraseñas): esos se cargan con scripts desde la compu del admin.

insert into public.torneos (id, nombre, desde, hasta, lugar, logro, hito) values
  ('primavera', 'Copa Primavera', '2026-09-26', '2026-09-27', 'Florida', '🏆 Campeones', 'Nuestro primer torneo oficial.'),
  ('oriental-2026', 'Copa Oriental 2026 · 11.ª edición', '2026-12-04', '2026-12-06', 'Punta del Este, Maldonado', null, null),
  ('ciudad-de-la-furia-2027', 'Ciudad de la Furia · Torneo de Ultimate Mixto', '2027-03-26', '2027-03-28', 'Argentina', null, null)
on conflict (id) do nothing;

insert into public.jugadores (slug, nombre, apodo, foto, numero, nacionalidad, dato) values
  ('ainara-rodriguez', 'Ainara Rodriguez', 'Aini', 'ainara-rodriguez.webp', 4, 'Uruguaya', 'Mejor forehand que varios que juegan hace años…'),
  ('camila-couture', 'Camila Couture', 'Camilinha', 'camila-couture.webp', 24, 'Uruguaya', 'La mamá del grupo, y gran handler cuando la obligamos.'),
  ('juanjo-alonso', 'Juanjo Alonso', 'Juano', 'juanjo-alonso.webp', 10, 'Uruguaya', 'La persona más flexible que vas a conocer.'),
  ('julieta-noguez', 'Julieta Noguez', 'Ju', 'julieta-noguez.webp', 33, 'Uruguaya', 'Si se enoja, no la mires: temé por tu vida.'),
  ('leandro-rodriguez', 'Leandro Rodriguez', 'Lean', 'leandro-rodriguez.webp', 22, 'Uruguaya', 'Cuidado, que te salta por arriba.'),
  ('luis-davila', 'Luis Davila', 'Luisito', 'luis-davila.webp', 7, 'Uruguaya', 'La foto no está editada, el hombre realmente está así.'),
  ('matilde-rodriguez', 'Matilde Rodriguez', 'Matildinha', 'matilde-rodriguez.webp', 21, 'Uruguaya', 'La real peque: es nuestra estrellita, aunque en el fondo es Chucky.'),
  ('nicolas-cabana', 'Nicolas Cabana', 'Nico', 'nicolas-cabana.webp', 5, 'Uruguaya', 'El veterano del equipo.'),
  ('rosina-cordero', 'Rosina Cordero', 'Rosi', 'rosina-cordero.webp', 12, 'Uruguaya', 'Más rápida que el Correcaminos. La queremos.'),
  ('santiago-rodriguez', 'Santiago Rodriguez', 'Santi', 'santiago-rodriguez.webp', 9, 'Uruguaya', 'Si hace give and go, andá preparándote para atacar en el siguiente punto.'),
  ('sebastian-migdal', 'Sebastian Migdal', 'Seba', 'sebastian-migdal.webp', 30, 'Uruguaya', 'El muñe, por su gran forehand.'),
  ('sofia-rodriguez', 'Sofia Rodriguez', 'Sofi', 'sofia-rodriguez.webp', 27, 'Uruguaya', 'Lentamente se está transformando en el demonio de Tasmania, pero maneja mejor que vos.'),
  ('thiago-elizalde', 'Thiago Elizalde', 'Facha', 'thiago-elizalde.webp', 6, 'Uruguaya', 'Llega tarde siempre, pero es el Facha.')
on conflict (slug) do nothing;

-- Los partidos no tienen una clave natural: solo se cargan si la tabla está vacía
insert into public.partidos (torneo_id, fecha, fase, rival, nuestros, suyos)
select * from (values
    ('primavera', '2026-09-26'::date, 'Fase de grupos', 'Tordos', 15, 12),
    ('primavera', '2026-09-26'::date, 'Fase de grupos', 'Flama', 12, 0),
    ('primavera', '2026-09-26'::date, 'Fase de grupos', 'Mean Machine', 15, 5),
    ('primavera', '2026-09-27'::date, 'Semifinal', 'Flama', 15, 9),
    ('primavera', '2026-09-27'::date, 'Final', 'Tordos', 15, 6)
) as v(torneo_id, fecha, fase, rival, nuestros, suyos)
where not exists (select 1 from public.partidos);
