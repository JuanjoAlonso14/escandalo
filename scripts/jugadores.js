// Genera una página por jugador en jugador/<slug>.html, para compartir su carta.
// Al pegar el link en WhatsApp/Instagram se ve la carta del jugador; al abrirlo, lleva al sitio con la carta en grande.
//   node scripts/jugadores.js   (lo corre también el pipeline al publicar)
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE = "https://escandaloultimate.com";
const raiz = path.join(__dirname, "..");
const { JUGADORES } = vm.runInNewContext(fs.readFileSync(path.join(raiz, "js/data.js"), "utf8") + ";({ JUGADORES })");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const carpeta = path.join(raiz, "jugador");
fs.mkdirSync(carpeta, { recursive: true });
for (const f of fs.readdirSync(carpeta)) if (f.endsWith(".html")) fs.unlinkSync(path.join(carpeta, f));

for (const j of JUGADORES) {
  const slug = j.foto.replace(/\.[a-z0-9]+$/i, "");
  const titulo = `${j.apodo}${j.numero ? " · #" + j.numero : ""} — Escándalo Ultimate`;
  const desc = j.dato ? `${j.nombre}: ${j.dato}` : `${j.nombre}, jugador de Escándalo Ultimate.`;
  const destino = `/#j-${slug}`;
  fs.writeFileSync(path.join(carpeta, slug + ".html"), `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(titulo)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${BASE}/jugador/${slug}">
  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="Escándalo Ultimate">
  <meta property="og:locale" content="es_UY">
  <meta property="og:title" content="${esc(titulo)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${BASE}/jugador/${slug}">
  <meta property="og:image" content="${BASE}/assets/jugadores/compartir/${slug}.jpg">
  <meta property="og:image:width" content="720">
  <meta property="og:image:height" content="1280">
  <meta property="og:image:alt" content="Carta de ${esc(j.nombre)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta http-equiv="refresh" content="0; url=${destino}">
  <link rel="icon" href="/assets/logos/favicon.png">
  <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b10;color:#f4f4f7;font-family:system-ui,sans-serif}a{color:#ffb81c}</style>
</head>
<body>
  <p><a href="${destino}">Ver la carta de ${esc(j.apodo)} en Escándalo Ultimate →</a></p>
</body>
</html>
`);
}
console.log(`✓ ${JUGADORES.length} páginas de jugador generadas en jugador/`);
