// Verifica el sitio antes de publicar: sintaxis de los JS y que existan los archivos que se usan.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
let errores = 0;
const falla = (m) => { console.error("✗ " + m); errores++; };

for (const f of fs.readdirSync("js")) {
  try { new vm.Script(fs.readFileSync(path.join("js", f), "utf8"), { filename: f }); }
  catch (e) { falla(`js/${f}: ${e.message}`); }
}

const existe = (p) => fs.existsSync(path.join("assets", p));
const data = fs.readFileSync("js/data.js", "utf8");
for (const m of data.matchAll(/(?:src|poster|portada|foto|pdf):\s*"([^"]+)"/g)) {
  const rel = m[1];
  const ruta = rel.includes("/") ? rel : "jugadores/" + rel;   // las fotos de jugadores no llevan carpeta
  if (!existe(ruta)) falla(`assets/${ruta} (referenciado en js/data.js) no existe`);
}

for (const f of fs.readdirSync(".").filter((x) => x.endsWith(".html"))) {
  const html = fs.readFileSync(f, "utf8");
  for (const m of html.matchAll(/(?:src|href)="\/?((?:assets|css|js)\/[^"#?]+)"/g))
    if (!fs.existsSync(m[1])) falla(`${f}: falta ${m[1]}`);
}

if (errores) { console.error(`\n${errores} problema(s)`); process.exit(1); }
console.log("✓ Todo en orden");
