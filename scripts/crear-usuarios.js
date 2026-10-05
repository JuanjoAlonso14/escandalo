// Crea (o actualiza) un usuario por jugador en la base LOCAL y guarda el hash en jugadores_claves.
// Contraseña por defecto: sunombre123. Claves propias en supabase/claves-locales.json (no se sube a Git).
//   node scripts/crear-usuarios.js        (con la base prendida: npx supabase start)
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const raiz = path.join(__dirname, "..");
const env = Object.fromEntries(
  execSync("npx --yes supabase status -o env", { cwd: raiz, encoding: "utf8" })
    .split("\n").map((l) => l.match(/^(\w+)="?(.*?)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
const URL = env.API_URL, CLAVE = env.SERVICE_ROLE_KEY;
if (!URL || !CLAVE) { console.error("No pude leer la base local. ¿Está prendida? (npx supabase start)"); process.exit(1); }
if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(URL)) { console.error("Esto solo corre contra la base local."); process.exit(1); }

const CONTRASENA = "sunombre123";
const ADMINS = ["juanjo-alonso", "camila-couture"];
const archivoClaves = path.join(raiz, "supabase", "claves-locales.json");
const claves = fs.existsSync(archivoClaves) ? JSON.parse(fs.readFileSync(archivoClaves, "utf8")) : {};
const cab = { apikey: CLAVE, Authorization: `Bearer ${CLAVE}`, "Content-Type": "application/json" };

(async () => {
  const jugadores = await (await fetch(`${URL}/rest/v1/jugadores?select=slug,nombre&order=nombre`, { headers: cab })).json();
  const existentes = (await (await fetch(`${URL}/auth/v1/admin/users?per_page=500`, { headers: cab })).json()).users || [];
  for (const j of jugadores) {
    const email = `${j.slug}@escandalo.test`;
    const password = claves[j.slug] || CONTRASENA;
    const cuerpo = JSON.stringify({ email, password, email_confirm: true, user_metadata: { jugador: j.slug, nombre: j.nombre } });
    const ya = existentes.find((u) => u.email === email);
    const r = await fetch(ya ? `${URL}/auth/v1/admin/users/${ya.id}` : `${URL}/auth/v1/admin/users`, { method: ya ? "PUT" : "POST", headers: cab, body: cuerpo });
    let rolTxt = "", hashTxt = "";
    if (r.ok) {
      const u = await r.clone().json();
      const rol = ADMINS.includes(j.slug) ? "admin" : "usuario";
      const p = await fetch(`${URL}/rest/v1/perfiles`, { method: "POST", headers: { ...cab, Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ id: u.id, jugador_slug: j.slug, rol }) });
      rolTxt = p.ok ? ` [${rol}]` : ` [perfil HTTP ${p.status}]`;
      // Hash en jugadores_claves vía SQL local (la función no se expone por la API a propósito)
      try {
        const sql = `select set_jugador_clave('${j.slug.replace(/'/g, "''")}', '${password.replace(/'/g, "''")}')`;
        execSync(`docker exec -i supabase_db_escandalo psql -U postgres -v ON_ERROR_STOP=1 -c ${JSON.stringify(sql)}`, { stdio: "pipe" });
        hashTxt = " [hash]";
      } catch (e) { hashTxt = " [hash falló]"; }
    }
    console.log(`${r.ok ? "✓" : "✗"} ${j.nombre.padEnd(20)} ${ya ? "actualizado" : "creado"}${claves[j.slug] ? " (clave propia)" : ""}${rolTxt}${hashTxt}  (${email})${r.ok ? "" : " HTTP " + r.status}`);
  }
})();
