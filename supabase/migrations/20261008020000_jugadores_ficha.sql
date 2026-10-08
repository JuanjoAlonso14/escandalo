-- Datos internos del plantel, en la misma tabla jugadores.
-- El sitio público entra como anónimo: esas columnas no se pueden leer sin sesión.
-- Un admin las ve y las edita desde el panel (la escritura ya exige es_admin()).

alter table public.jugadores
  add column sexo text check (sexo in ('Mujer', 'Hombre')),
  add column cedula text check (cedula is null or (length(cedula) between 1 and 20)),
  add column nacimiento date,
  add column reglas text check (reglas in ('Estándar', 'Avanzado')),
  add column contacto_nombre text check (contacto_nombre is null or (length(contacto_nombre) between 1 and 80)),
  add column contacto_tel text check (contacto_tel is null or (length(contacto_tel) between 1 and 40)),
  add column cobertura text check (cobertura is null or (length(cobertura) between 1 and 80)),
  add column socio boolean;

revoke select (sexo, cedula, nacimiento, reglas, contacto_nombre, contacto_tel, cobertura, socio)
  on public.jugadores from public, anon;

update public.jugadores j
set sexo = v.sexo,
    cedula = nullif(v.cedula, ''),
    nacimiento = v.nacimiento,
    reglas = nullif(v.reglas, ''),
    contacto_nombre = nullif(v.contacto_nombre, ''),
    contacto_tel = nullif(v.contacto_tel, ''),
    cobertura = nullif(v.cobertura, ''),
    socio = v.socio
from (
  values
    ('camila-couture',     'Mujer',  '60716283', date '2001-02-24', 'Avanzado', 'Analia Santos',        '91078346',    'Cosem',            true),
    ('matilde-rodriguez',  'Mujer',  '56664664', date '2007-08-21', 'Avanzado', 'Analia Rodríguez',     '99088842',    'CASMU',            true),
    ('sofia-rodriguez',    'Mujer',  '56841343', date '2007-10-27', 'Estándar', '',                     '91627738',    '',                 true),
    ('julieta-noguez',     'Mujer',  '58749787', date '2006-08-28', 'Avanzado', 'Ana Cimcich',          '96581901',    'Círculo católico', true),
    ('rosina-cordero',     'Mujer',  '58099391', date '2008-04-22', 'Avanzado', 'Estela Martinez',      '97340025',    'No',               null),
    ('ainara-rodriguez',   'Mujer',  '56753285', date '2003-12-18', 'Estándar', 'María Noel',           '99253461',    'Círculo católico', false),
    ('santiago-rodriguez', 'Hombre', '52463893', date '2002-09-20', 'Avanzado', 'Marcelo Rodríguez',    '99863842',    '',                 false),
    ('juanjo-alonso',      'Hombre', '60197552', date '2008-04-14', 'Avanzado', 'Jorge Alonso',         '99974670',    'SMI',              true),
    ('leandro-rodriguez',  'Hombre', '56671643', date '2006-08-22', 'Avanzado', 'Patricia PiedraBuena', '32399575',    'ASSE',             true),
    ('thiago-elizalde',    'Hombre', '52344181', date '2002-02-03', 'Estándar', 'Gustavo Elizalde',     '9504475',     'Casmu',            null),
    ('nicolas-cabana',     'Hombre', '52067252', date '1999-06-21', 'Avanzado', 'Lucero Lamancha',      '097 98 328', 'Médica Uruguaya',  true),
    ('sebastian-migdal',   'Hombre', '50180909', date '2000-08-03', 'Estándar', 'Mariel Camejo',        '99142140',    'Casmu',            true),
    ('luis-davila',        'Hombre', '56603793', date '2007-02-07', 'Estándar', 'Milton Dávila',        '91969103',    'ASSE',             null),
    ('maximiliano-lois',   'Hombre', '',          null::date,        '',         '',                     '',            '',                 false)
) as v(slug, sexo, cedula, nacimiento, reglas, contacto_nombre, contacto_tel, cobertura, socio)
where j.slug = v.slug;
