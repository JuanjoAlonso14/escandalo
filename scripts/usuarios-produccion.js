// Crea los usuarios del sitio en la base de PRODUCCIÓN, cada uno con su propia contraseña real.
//   node scripts/usuarios-produccion.js
// Pide por pantalla (sin mostrarla ni guardarla) la clave secreta "service_role" del proyecto, y la contraseña del admin.
// A los demás jugadores les genera una contraseña aleatoria y la guarda en supabase/privado/credenciales-produccion.txt
// (carpeta que Git ignora) para que se la pases a cada uno. Quien ya tiene usuario se saltea: no se pisa nada.
//   node scripts/usuarios-produccion.js --resetear sofia-rodriguez   genera una contraseña nueva para esa persona
// Para pruebas locales: URL_SUPABASE=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=... node scripts/usuarios-produccion.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const raiz = path.join(__dirname, "..");
const ADMINS = ["juanjo-alonso", "camila-couture"];                                  // quienes tienen rol admin
const URL = (process.env.URL_SUPABASE || "https://efdlvrznaqbijyftwzgf.supabase.co").replace(/\/$/, "");
const local = /^https?:\/\/(127\.0\.0\.1|localhost)/.test(URL);
const resetear = process.argv.includes("--resetear") ? process.argv[process.argv.indexOf("--resetear") + 1] : null;

// Lee texto del teclado sin mostrarlo en pantalla
function preguntarOculto(texto) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) return resolve("");
    process.stdout.write(texto);
    process.stdin.setRawMode(true); process.stdin.resume(); process.stdin.setEncoding("utf8");
    let valor = "";
    const alTeclear = (trozo) => {
      for (const c of trozo) {
        if (c === "\u0003") process.exit(1);                         // Ctrl+C
        if (c === "\r" || c === "\n") { process.stdin.setRawMode(false); process.stdin.pause(); process.stdin.off("data", alTeclear); process.stdout.write("\n"); return resolve(valor); }
        if (c === "\u007f" || c === "\b") valor = valor.slice(0, -1); else valor += c;
      }
    };
    process.stdin.on("data", alTeclear);
  });
}
// Guarda cada contraseña generada en el instante en que se crea el usuario, para no perderla si el script se corta después
function guardarClave(linea) {
  const carpeta = path.join(raiz, "supabase", "privado"); fs.mkdirSync(carpeta, { recursive: true });
  const archivo = path.join(carpeta, local ? "credenciales-local-prueba.txt" : "credenciales-produccion.txt");
  if (!guardarClave.encabezado) { fs.appendFileSync(archivo, `\n# ${new Date().toISOString().slice(0, 10)} — entran en /login eligiendo su nombre y esta contraseña\n`); guardarClave.encabezado = true; }
  fs.appendFileSync(archivo, linea + "\n");
  return archivo;
}
const generar = () => Array.from({ length: 12 }, () => "abcdefghjkmnpqrstuvwxyz23456789"[crypto.randomInt(31)]).join("");
const limpiar = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

(async () => {
  if (!local && !/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(URL)) { console.error("La dirección del proyecto no parece válida:", URL); process.exit(1); }
  let clave = process.env.SUPABASE_SERVICE_ROLE_KEY || (await preguntarOculto("Clave secreta service_role del proyecto (no se muestra): ")).trim();
  if (!clave) { console.error("Hace falta la clave secreta. Se encuentra en Project Settings → API Keys → secret / service_role."); process.exit(1); }
  // Las claves nuevas (sb_secret_…) no son un JWT: van solo en "apikey". Las viejas (service_role) también en Authorization.
  const cab = { apikey: clave, ...(clave.startsWith("sb_") ? {} : { Authorization: `Bearer ${clave}` }), "Content-Type": "application/json" };
  const api = async (ruta, opciones = {}) => fetch(`${URL}${ruta}`, { ...opciones, headers: { ...cab, ...(opciones.headers || {}) }, signal: AbortSignal.timeout(15000) });

  const prueba = await api("/auth/v1/admin/users?per_page=1");
  if (!prueba.ok) { console.error(`La clave no sirve para ${URL} (HTTP ${prueba.status}). ¿Copiaste la clave secreta de ese proyecto?`); process.exit(1); }
  console.log(`Conectado a ${URL}${local ? " (local)" : " (PRODUCCIÓN)"}`);

  const jr = await api("/rest/v1/jugadores?select=slug,nombre&order=nombre");
  const jugadores = jr.ok ? await jr.json() : [];
  if (!jugadores.length) { console.error("No hay jugadores en la base. ¿Corriste antes `npx supabase db push`?"); process.exit(1); }
  const existentes = (await (await api("/auth/v1/admin/users?per_page=1000")).json()).users || [];

  const creadas = [];
  for (const j of jugadores) {
    if (resetear && j.slug !== resetear) continue;
    const email = `${j.slug}@escandalo.test`;
    const ya = existentes.find((u) => u.email === email);
    if (ya && !resetear) {
      const rolActual = ADMINS.includes(j.slug) ? "admin" : "usuario";
      const p0 = await api("/rest/v1/perfiles", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ id: ya.id, jugador_slug: j.slug, rol: rolActual }) });
      console.log(`  · ${j.nombre.padEnd(20)} ya tiene usuario [${rolActual}]${p0.ok ? "" : " (perfil HTTP " + p0.status + ")"}`); continue;
    }
    let password;
    if (ADMINS.includes(j.slug)) {
      password = process.env["CLAVE_ADMIN_" + j.slug.toUpperCase().replace(/-/g, "_")] || (await preguntarOculto(`Contraseña para el ADMIN ${j.nombre} (mínimo 12 caracteres): `));
      if (password.length < 12) { console.error("La contraseña del admin tiene que tener al menos 12 caracteres."); process.exit(1); }
    } else password = generar();
    const cuerpo = JSON.stringify({ email, password, email_confirm: true, user_metadata: { jugador: j.slug, nombre: j.nombre } });
    const r = await api(ya ? `/auth/v1/admin/users/${ya.id}` : "/auth/v1/admin/users", { method: ya ? "PUT" : "POST", body: cuerpo });
    if (!r.ok) { console.log(`  ✗ ${j.nombre}: HTTP ${r.status} ${(await r.text()).slice(0, 120)}`); continue; }
    const u = await r.json();
    if (!ADMINS.includes(j.slug)) { guardarClave(`${j.nombre}: ${password}`); creadas.push(j.nombre); }
    const rol = ADMINS.includes(j.slug) ? "admin" : "usuario";
    const p = await api("/rest/v1/perfiles", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ id: u.id, jugador_slug: j.slug, rol }) });
    console.log(`  ${p.ok ? "✓" : "✗"} ${j.nombre.padEnd(20)} ${ya ? "contraseña nueva" : "creado"} [${rol}]${p.ok ? "" : " perfil HTTP " + p.status}`);
  }

  if (creadas.length) {
    console.log(`
Contraseñas de ${creadas.length} jugadores guardadas en supabase/privado/${local ? "credenciales-local-prueba.txt" : "credenciales-produccion.txt"} (no se sube a Git).`);
    console.log("Pasale a cada jugador la suya por privado (WhatsApp 1 a 1), no por el grupo.");
  }
})();
