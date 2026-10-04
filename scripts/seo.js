// Genera robots.txt y sitemap.xml. Lo corre el pipeline al publicar (y se puede correr a mano).
//   node scripts/seo.js
const fs = require("fs");
const path = require("path");

const BASE = "https://escandaloultimate.com";
const raiz = path.join(__dirname, "..");
const hoy = new Date().toISOString().slice(0, 10);

// Páginas indexables. Las de /jugador/* son atajos para compartir: no se listan y llevan noindex (sin bloquearlas en robots.txt para que WhatsApp lea su vista previa).
const paginas = [
  ["/", "1.0", "weekly"],
  ["/historia", "0.7", "monthly"],
  ["/ultimate", "0.7", "monthly"],
  ["/calendario", "0.8", "weekly"],
  ["/galeria", "0.6", "monthly"],
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paginas.map(([ruta, prio, freq]) => `  <url>
    <loc>${BASE}${ruta === "/" ? "/" : ruta}</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${prio}</priority>
  </url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(raiz, "sitemap.xml"), xml);

fs.writeFileSync(path.join(raiz, "robots.txt"), `User-agent: *
Allow: /

Sitemap: ${BASE}/sitemap.xml
`);
console.log(`✓ sitemap.xml (${paginas.length} páginas) y robots.txt generados`);
