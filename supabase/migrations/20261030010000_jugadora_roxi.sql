-- Roxi: todavía no está en el roster público ni tiene cuenta.
-- Queda no activa para poder sumarla al roster de cualquier torneo en el trackeo.
-- Cuando tenga carta y cuenta: se activa desde el panel y se completan nombre, apodo y número.

insert into public.jugadores (slug, nombre, apodo, foto, activo, rol)
values ('roxi', 'Roxi', 'Roxi', 'roxi.webp', false, 'jugador')
on conflict (slug) do nothing;
