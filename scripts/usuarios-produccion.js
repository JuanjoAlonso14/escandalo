// Crea o resetea usuarios en PRODUCCIÓN.
//   node scripts/usuarios-produccion.js              → solo crea los que faltan
//   node scripts/usuarios-produccion.js --todos      → resetea TODOS (admins con clave fija, resto aleatoria)
//   node scripts/usuarios-produccion.js --resetear sofia-rodriguez
//
// Admins (juanjo, camila, santiago, matilde): contraseña desde
//   1) env CLAVE_ADMIN_JUANJO_ALONSO / CLAVE_ADMIN_CAMILA_COUTURE
//   2) supabase/claves-locales.json (opcional, local; no se sube a Git)
//   3) pregunta oculta por pantalla
// El hash de referencia queda en jugadores.password_hash (no se lee ni se escribe por el sitio).
// Resto: contraseña aleatoria → supabase/privado/credenciales-produccion.txt
//
// Pide la service_role por pantalla (o SUPABASE_SERVICE_ROLE_KEY). Nunca la subas a Git ni al chat.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const raiz = path.join(__dirname, "..");
const ADMINS = ["juanjo-alonso", "camila-couture", "santiago-rodriguez", "matilde-rodriguez"];
const rolDe = (slug) => (ADMINS.includes(slug) ? "admin" : "jugador");
const URL = (process.env.URL_SUPABASE || "https://efdlvrznaqbijyftwzgf.supabase.co").replace(/\/$/, "");
const local = /^https?:\/\/(127\.0\.0\.1|localhost)/.test(URL);
const todos = process.argv.includes("--todos");
const resetear = process.argv.includes("--resetear") ? process.argv[process.argv.indexOf("--resetear") + 1] : null;

const archivoClaves = path.join(raiz, "supabase", "claves-locales.json");
const clavesFijas = fs.existsSync(archivoClaves) ? JSON.parse(fs.readFileSync(archivoClaves, "utf8")) : {};

function preguntarOculto(texto) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) return resolve("");
    process.stdout.write(texto);
    process.stdin.setRawMode(true); process.stdin.resume(); process.stdin.setEncoding("utf8");
    let valor = "";
    const alTeclear = (trozo) => {
      for (const c of trozo) {
        if (c === "\u0003") process.exit(1);
        if (c === "\r" || c === "\n") { process.stdin.setRawMode(false); process.stdin.pause(); process.stdin.off("data", alTeclear); process.stdout.write("\n"); return resolve(valor); }
        if (c === "\u007f" || c === "\b") valor = valor.slice(0, -1); else valor += c;
      }
    };
    process.stdin.on("data", alTeclear);
  });
}

function archivoCredenciales() {
  const carpeta = path.join(raiz, "supabase", "privado"); fs.mkdirSync(carpeta, { recursive: true });
  return path.join(carpeta, local ? "credenciales-local-prueba.txt" : "credenciales-produccion.txt");
}

function guardarClave(linea) {
  const archivo = archivoCredenciales();
  if (!guardarClave.encabezado) {
    fs.appendFileSync(archivo, `\n# ${new Date().toISOString().slice(0, 10)} — entran en /login eligiendo su nombre y esta contraseña\n`);
    guardarClave.encabezado = true;
  }
  fs.appendFileSync(archivo, linea + "\n");
  return archivo;
}

const generar = () => Array.from({ length: 12 }, () => "abcdefghjkmnpqrstuvwxyz23456789"[crypto.randomInt(31)]).join("");

async function claveAdmin(j) {
  const envName = "CLAVE_ADMIN_" + j.slug.toUpperCase().replace(/-/g, "_");
  const desdeEnv = process.env[envName];
  if (desdeEnv) return desdeEnv;
  if (clavesFijas[j.slug]) return clavesFijas[j.slug];
  const escrita = await preguntarOculto(`Contraseña para el ADMIN ${j.nombre} (mínimo 12 caracteres): `);
  return escrita;
}

(async () => {
  if (!local && !/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(URL)) { console.error("La dirección del proyecto no parece válida:", URL); process.exit(1); }
  let clave = process.env.SUPABASE_SERVICE_ROLE_KEY || (await preguntarOculto("Clave secreta service_role del proyecto (no se muestra): ")).trim();
  if (!clave) { console.error("Hace falta la clave secreta. Se encuentra en Project Settings → API Keys → secret / service_role."); process.exit(1); }
  const cab = { apikey: clave, ...(clave.startsWith("sb_") ? {} : { Authorization: `Bearer ${clave}` }), "Content-Type": "application/json" };
  const api = async (ruta, opciones = {}) => fetch(`${URL}${ruta}`, { ...opciones, headers: { ...cab, ...(opciones.headers || {}) }, signal: AbortSignal.timeout(15000) });

  const prueba = await api("/auth/v1/admin/users?per_page=1");
  if (!prueba.ok) { console.error(`La clave no sirve para ${URL} (HTTP ${prueba.status}). ¿Copiaste la clave secreta de ese proyecto?`); process.exit(1); }
  console.log(`Conectado a ${URL}${local ? " (local)" : " (PRODUCCIÓN)"}${todos ? " — reseteando TODOS" : ""}`);

  const jr = await api("/rest/v1/jugadores?select=id,slug,nombre&order=nombre");
  const jugadores = jr.ok ? await jr.json() : [];
  if (!jugadores.length) { console.error("No hay jugadores en la base. ¿Corriste antes `npx supabase db push`?"); process.exit(1); }
  const existentes = (await (await api("/auth/v1/admin/users?per_page=1000")).json()).users || [];

  const creadas = [];
  for (const j of jugadores) {
    if (resetear && j.slug !== resetear) continue;
    const email = `${j.slug}@escandalo.test`;
    const ya = existentes.find((u) => u.email === email);
    const hayQuePisar = todos || (resetear && j.slug === resetear);
    if (ya && !hayQuePisar) {
      const rolActual = rolDe(j.slug);
      const p0 = await api("/rest/v1/perfiles", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ id: ya.id, jugador_id: j.id, rol: rolActual }) });
      await api(`/rest/v1/jugadores?id=eq.${j.id}`, { method: "PATCH", body: JSON.stringify({ rol: rolActual }) });
      console.log(`  · ${j.nombre.padEnd(20)} ya tiene usuario [${rolActual}]${p0.ok ? "" : " (perfil HTTP " + p0.status + ")"}`); continue;
    }
    let password;
    if (ADMINS.includes(j.slug)) {
      password = await claveAdmin(j);
      if (!password || password.length < 12) { console.error(`La contraseña del admin ${j.nombre} tiene que tener al menos 12 caracteres.`); process.exit(1); }
    } else password = generar();
    const cuerpo = JSON.stringify({ email, password, email_confirm: true, user_metadata: { jugador: j.slug, jugador_id: j.id, nombre: j.nombre } });
    const r = await api(ya ? `/auth/v1/admin/users/${ya.id}` : "/auth/v1/admin/users", { method: ya ? "PUT" : "POST", body: cuerpo });
    if (!r.ok) { console.log(`  ✗ ${j.nombre}: HTTP ${r.status} ${(await r.text()).slice(0, 120)}`); continue; }
    const u = await r.json();
    if (ADMINS.includes(j.slug)) {
      guardarClave(`${j.nombre}: (admin — clave fija, no aleatoria)`);
    } else {
      guardarClave(`${j.nombre}: ${password}`);
      creadas.push(j.nombre);
    }
    const rol = rolDe(j.slug);
    const p = await api("/rest/v1/perfiles", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ id: u.id, jugador_id: j.id, rol }) });
    await api(`/rest/v1/jugadores?id=eq.${j.id}`, { method: "PATCH", body: JSON.stringify({ rol }) });
    console.log(`  ${p.ok ? "✓" : "✗"} ${j.nombre.padEnd(20)} ${ya ? "contraseña nueva" : "creado"} [${rol}]${ADMINS.includes(j.slug) ? " (clave fija)" : ""}${p.ok ? "" : " perfil HTTP " + p.status}`);
  }

  const archivo = archivoCredenciales();
  if (creadas.length) {
    console.log(`\nContraseñas aleatorias de ${creadas.length} jugadores → ${archivo}`);
    console.log("Abrí ese archivo y pasale a cada uno la suya por privado (WhatsApp 1 a 1), no por el grupo.");
  } else if (fs.existsSync(archivo)) {
    console.log(`\nArchivo de credenciales: ${archivo}`);
  }
  console.log("Admins: Juanjo y Camila usan CLAVE_ADMIN_* o claves-locales.json (no van en el archivo de aleatorias).");
})();

