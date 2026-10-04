// Crea (o actualiza) un usuario por jugador en la base LOCAL, con contraseña <nombre>123.
// Es para desarrollo: la contraseña es adivinable a propósito. Antes de usar una base real, cambiar este esquema.
//   node scripts/crear-usuarios.js        (con la base prendida: npx supabase start)
const { execSync } = require("child_process");
const path = require("path");

const raiz = path.join(__dirname, "..");
const env = Object.fromEntries(
  execSync("npx --yes supabase status -o env", { cwd: raiz, encoding: "utf8" })
    .split("\n").map((l) => l.match(/^(\w+)="?(.*?)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
const URL = env.API_URL, CLAVE = env.SERVICE_ROLE_KEY;
if (!URL || !CLAVE) { console.error("No pude leer la base local. ¿Está prendida? (npx supabase start)"); process.exit(1); }
if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(URL)) { console.error("Esto solo corre contra la base local."); process.exit(1); }

const limpiar = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const cab = { apikey: CLAVE, Authorization: `Bearer ${CLAVE}`, "Content-Type": "application/json" };

(async () => {
  const jugadores = await (await fetch(`${URL}/rest/v1/jugadores?select=slug,nombre&order=nombre`, { headers: cab })).json();
  const existentes = (await (await fetch(`${URL}/auth/v1/admin/users?per_page=500`, { headers: cab })).json()).users || [];
  for (const j of jugadores) {
    const email = `${j.slug}@escandalo.test`;
    const password = limpiar(j.nombre.split(" ")[0]) + "123";
    const cuerpo = JSON.stringify({ email, password, email_confirm: true, user_metadata: { jugador: j.slug, nombre: j.nombre } });
    const ya = existentes.find((u) => u.email === email);
    const r = await fetch(ya ? `${URL}/auth/v1/admin/users/${ya.id}` : `${URL}/auth/v1/admin/users`, { method: ya ? "PUT" : "POST", headers: cab, body: cuerpo });
    console.log(`${r.ok ? "✓" : "✗"} ${j.nombre.padEnd(20)} ${ya ? "actualizado" : "creado"}  (${email})${r.ok ? "" : " HTTP " + r.status}`);
  }
})();
