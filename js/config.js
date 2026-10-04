// A qué base de datos se conecta el sitio, según dónde esté abierto:
//  - En tu compu (localhost): la base local de Supabase (npx supabase start).
//  - En escandaloultimate.com: el proyecto de producción de Supabase.
//  - En cualquier otro lado: ninguna (el sitio usa los datos de js/data.js).
// La clave "publishable" es pública por diseño: la seguridad la dan las reglas de la base (RLS), no esta clave.
// "espera" = cuántos milisegundos se espera a la base antes de usar los datos de respaldo.
const SUPABASE = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? { url: "http://127.0.0.1:54321", key: "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH", espera: 2500 }
  : ["escandaloultimate.com", "www.escandaloultimate.com"].includes(location.hostname)
    ? { url: "https://efdlvrznaqbijyftwzgf.supabase.co", key: "sb_publishable_sm-zM-7vH4P4nL36mvwtoQ_ZKBcvnje", espera: 1200 }
    : null;
