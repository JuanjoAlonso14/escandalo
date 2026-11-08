// Respaldo completo de la base de PRODUCCIÓN (el plan gratis de Supabase no guarda copias).
//   node scripts/respaldo.js
// Deja tres archivos en supabase/privado/respaldos/<fecha>/ (carpeta ignorada por Git: tienen datos personales):
//   esquema.sql        tablas, funciones y permisos
//   datos.sql          filas de las tablas del sitio (jugadores, asistencia, caja, trackeo...)
//   usuarios.sql       cuentas de /login (auth), para que sigan entrando con su contraseña
// Necesita Docker abierto y el proyecto vinculado (npx supabase link). Solo lee: no cambia nada en producción.
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
const ahora = new Date();
const dos = (n) => String(n).padStart(2, "0");
const sello = `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}_${dos(ahora.getHours())}${dos(ahora.getMinutes())}`;
const carpeta = path.join(raiz, "supabase", "privado", "respaldos", sello);
fs.mkdirSync(carpeta, { recursive: true });

const partes = [
  ["esquema.sql", []],
  ["datos.sql", ["--data-only", "--use-copy", "--schema", "public"]],
  ["usuarios.sql", ["--data-only", "--use-copy", "--schema", "auth", "-x", "auth.sessions,auth.refresh_tokens,auth.audit_log_entries,auth.flow_state,auth.one_time_tokens"]],
];

for (const [archivo, extra] of partes) {
  const destino = path.join(carpeta, archivo);
  process.stdout.write(`  · ${archivo.padEnd(14)} `);
  const orden = ["npx supabase db dump --remote", "-f", `"${destino}"`, ...extra].join(" ");
  const r = spawnSync(orden, { cwd: raiz, shell: true, encoding: "utf8" });
  const tam = fs.existsSync(destino) ? fs.statSync(destino).size : 0;
  if (r.status !== 0 || !tam) {
    console.log("falló");
    console.error((r.stderr || r.stdout || "").trim().split("\n").slice(-5).join("\n"));
    console.error("¿Está abierto Docker? ¿El proyecto está vinculado (npx supabase link)?");
    process.exit(1);
  }
  console.log(`${(tam / 1024).toFixed(0)} KB`);
}

console.log(`\nRespaldo listo en ${path.relative(raiz, carpeta)}`);
console.log("Tiene datos personales: no lo subas a ningún lado público. Copialo también fuera de esta compu (un pendrive o tu Drive privado).");
