// Crea (o actualiza) un usuario por jugador en la base LOCAL y guarda el hash en jugadores.password_hash.
// Contraseña por defecto: sunombre123.
// Admins (Juanjo, Camila): NO se pisa la contraseña salvo que haya
//   CLAVE_ADMIN_JUANJO_ALONSO / CLAVE_ADMIN_CAMILA_COUTURE o supabase/claves-locales.json (local, no Git).
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
const ADMINS = ["juanjo-alonso", "camila-couture", "santiago-rodriguez", "matilde-rodriguez"];
const rolDe = (slug) => (ADMINS.includes(slug) ? "admin" : "jugador");
const archivoClaves = path.join(raiz, "supabase", "claves-locales.json");
const claves = fs.existsSync(archivoClaves) ? JSON.parse(fs.readFileSync(archivoClaves, "utf8")) : {};
const cab = { apikey: CLAVE, Authorization: `Bearer ${CLAVE}`, "Content-Type": "application/json" };

function claveAdmin(slug) {
  const envName = "CLAVE_ADMIN_" + slug.toUpperCase().replace(/-/g, "_");
  return process.env[envName] || claves[slug] || null;
}

(async () => {
  const jugadores = await (await fetch(`${URL}/rest/v1/jugadores?select=id,slug,nombre&order=nombre`, { headers: cab })).json();
  const existentes = (await (await fetch(`${URL}/auth/v1/admin/users?per_page=500`, { headers: cab })).json()).users || [];
  for (const j of jugadores) {
    const email = `${j.slug}@escandalo.test`;
    const ya = existentes.find((u) => u.email === email);
    const esAdmin = ADMINS.includes(j.slug);
    const propia = esAdmin ? claveAdmin(j.slug) : (claves[j.slug] || null);
    // Admin sin clave explícita: si ya existe, solo sincroniza perfil; si no, no se puede crear sin contraseña
    if (esAdmin && !propia) {
      if (!ya) {
        console.log(`✗ ${j.nombre.padEnd(20)} admin sin contraseña (definí CLAVE_ADMIN_* o claves-locales.json)`);
        continue;
      }
      const rol = rolDe(j.slug);
      const p = await fetch(`${URL}/rest/v1/perfiles`, { method: "POST", headers: { ...cab, Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ id: ya.id, jugador_id: j.id, rol }) });
      await fetch(`${URL}/rest/v1/jugadores?id=eq.${j.id}`, { method: "PATCH", headers: cab, body: JSON.stringify({ rol }) });
      console.log(`· ${j.nombre.padEnd(20)} ya tiene usuario [${rol}] (contraseña intacta)${p.ok ? "" : " perfil HTTP " + p.status}`);
      continue;
    }
    const password = propia || CONTRASENA;
    const cuerpo = JSON.stringify({ email, password, email_confirm: true, user_metadata: { jugador: j.slug, jugador_id: j.id, nombre: j.nombre } });
    const r = await fetch(ya ? `${URL}/auth/v1/admin/users/${ya.id}` : `${URL}/auth/v1/admin/users`, { method: ya ? "PUT" : "POST", headers: cab, body: cuerpo });
    let rolTxt = "", hashTxt = "";
    if (r.ok) {
      const u = await r.clone().json();
      const rol = rolDe(j.slug);
      const p = await fetch(`${URL}/rest/v1/perfiles`, { method: "POST", headers: { ...cab, Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ id: u.id, jugador_id: j.id, rol }) });
      await fetch(`${URL}/rest/v1/jugadores?id=eq.${j.id}`, { method: "PATCH", headers: cab, body: JSON.stringify({ rol }) });
      rolTxt = p.ok ? ` [${rol}]` : ` [perfil HTTP ${p.status}]`;
      try {
        const sql = `select set_jugador_clave('${j.slug.replace(/'/g, "''")}', '${password.replace(/'/g, "''")}')`;
        execSync(`docker exec -i supabase_db_escandalo psql -U postgres -v ON_ERROR_STOP=1 -c ${JSON.stringify(sql)}`, { stdio: "pipe" });
        hashTxt = " [hash]";
      } catch (e) { hashTxt = " [hash falló]"; }
    }
    console.log(`${r.ok ? "✓" : "✗"} ${j.nombre.padEnd(20)} ${ya ? "actualizado" : "creado"}${propia ? " (clave propia)" : ""}${rolTxt}${hashTxt}  (${email})${r.ok ? "" : " HTTP " + r.status}`);
  }
})();
