// Genera supabase/seed.sql a partir de los datos actuales del sitio (js/data.js).
// Sirve para cargar la base local con datos reales. Correr: node scripts/generar-seed.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const raiz = path.join(__dirname, "..");
const { TORNEOS, JUGADORES, RESULTADOS } = vm.runInNewContext(
  fs.readFileSync(path.join(raiz, "js/data.js"), "utf8") + ";({ TORNEOS, JUGADORES, RESULTADOS })");
const q = (v) => (v == null ? "null" : "'" + String(v).replace(/'/g, "''") + "'");
const n = (v) => (v == null ? "null" : Number(v));

let sql = "-- Generado por scripts/generar-seed.js (no editar a mano)\n\n";
sql += "insert into public.torneos (id, nombre, desde, hasta, lugar, logro, hito) values\n" +
  TORNEOS.map((t) => `  (${q(t.id)}, ${q(t.nombre)}, ${q(t.desde)}, ${q(t.hasta)}, ${q(t.lugar)}, ${q(t.logro)}, ${q(t.hito)})`).join(",\n") + ";\n\n";
sql += "insert into public.jugadores (slug, nombre, apodo, foto, numero, nacionalidad, dato) values\n" +
  JUGADORES.map((j) => `  (${q(j.foto.replace(/\.[a-z0-9]+$/i, ""))}, ${q(j.nombre)}, ${q(j.apodo)}, ${q(j.foto)}, ${n(j.numero)}, ${q(j.nacionalidad)}, ${q(j.dato)})`).join(",\n") + ";\n\n";

const filas = [];
for (const r of RESULTADOS) {
  const [base, fase] = r.torneo.split(" · ");
  const t = TORNEOS.find((x) => x.nombre.split(" · ")[0] === base);
  if (!t) { console.warn("Sin torneo para el resultado:", r.torneo); continue; }
  filas.push(`  (${q(t.id)}, ${q(r.fecha)}, ${q(fase)}, ${q(r.rival)}, ${n(r.nuestros)}, ${n(r.suyos)})`);
}
sql += "insert into public.partidos (torneo_id, fecha, fase, rival, nuestros, suyos) values\n" + filas.join(",\n") + ";\n";
fs.writeFileSync(path.join(raiz, "supabase", "seed.sql"), sql);
console.log(`✓ seed.sql: ${TORNEOS.length} torneos, ${JUGADORES.length} jugadores, ${filas.length} partidos`);
