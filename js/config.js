// A qué base de datos se conecta el sitio.
// En tu compu (localhost) usa la base local de Supabase (npx supabase start).
// En el sitio publicado todavía no hay base: devuelve null y el sitio usa los datos de js/data.js.
// Cuando exista la base real en internet, se pone acá su dirección y su clave pública
// (la clave "publishable" es pública por diseño: la seguridad la dan las reglas de la base).
const SUPABASE = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? { url: "http://127.0.0.1:54321", key: "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" }
  : null;
