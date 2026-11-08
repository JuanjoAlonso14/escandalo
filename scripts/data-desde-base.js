// Actualiza la lista JUGADORES de js/data.js con lo que hay en la base de producción.
// js/data.js es el respaldo que usa el sitio si la base no responde, y de ahí salen las páginas jugador/<slug>.html.
//   node scripts/data-desde-base.js   (lo corre también el pipeline al publicar)
// Lee solo columnas públicas con la clave publishable, igual que cualquier visitante del sitio.
const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
const archivo = path.join(raiz, "js", "data.js");
const config = fs.readFileSync(path.join(raiz, "js", "config.js"), "utf8");
const url = config.match(/https:\/\/[a-z0-9]{20}\.supabase\.co/)?.[0];
const key = [...config.matchAll(/sb_publishable_[A-Za-z0-9_-]+/g)].pop()?.[0];   // la última es la de producción

(async () => {
  if (!url || !key) throw new Error("No encontré la dirección o la clave de producción en js/config.js");
  const r = await fetch(`${url}/rest/v1/jugadores?select=nombre,apodo,foto,numero,nacionalidad,dato&activo=eq.true&order=nombre.asc`,
    { headers: { apikey: key }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`La base respondió HTTP ${r.status}`);
  const jugadores = await r.json();
  if (!jugadores.length) throw new Error("La base no devolvió jugadores");

  const fila = (j) => {
    const campos = [`nombre: ${JSON.stringify(j.nombre)}`, `apodo: ${JSON.stringify(j.apodo)}`, `foto: ${JSON.stringify(j.foto)}`];
    if (j.numero != null) campos.push(`numero: ${j.numero}`);
    if (j.nacionalidad) campos.push(`nacionalidad: ${JSON.stringify(j.nacionalidad)}`);
    if (j.dato) campos.push(`dato: ${JSON.stringify(j.dato)}`);
    return `  { ${campos.join(", ")} },`;
  };
  const texto = fs.readFileSync(archivo, "utf8");
  const fin = texto.includes("\r\n") ? "\r\n" : "\n";
  const bloque = /const JUGADORES = \[\r?\n[\s\S]*?\r?\n\];/;
  if (!bloque.test(texto)) throw new Error("No encontré la lista JUGADORES en js/data.js");
  const nuevo = texto.replace(bloque, () => `const JUGADORES = [${fin}${jugadores.map(fila).join(fin)}${fin}];`);
  if (nuevo === texto) { console.log(`✓ js/data.js ya estaba al día (${jugadores.length} jugadores)`); return; }
  fs.writeFileSync(archivo, nuevo);
  console.log(`✓ js/data.js actualizado desde la base (${jugadores.length} jugadores)`);
  for (const j of jugadores)
    if (!fs.existsSync(path.join(raiz, "assets", "jugadores", j.foto))) console.warn(`  ! falta la foto assets/jugadores/${j.foto}`);
})().catch((e) => { console.error(`✗ No se actualizó js/data.js: ${e.message}`); process.exit(1); });
