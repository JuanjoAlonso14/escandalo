// Sube los PDF de prácticas al bucket privado "recursos".
// Los archivos salen de supabase/privado/recursos/ (esa carpeta no se commitea).
//   $env:SERVICE_ROLE_KEY = "..."; node scripts/subir-recursos.js
// En local, la clave sale de: npx supabase status -o env
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "supabase", "privado", "recursos");
const api = process.env.API_URL || "http://127.0.0.1:54321";
const key = process.env.SERVICE_ROLE_KEY;

(async () => {
  if (!key) { console.error("Falta SERVICE_ROLE_KEY"); process.exit(1); }
  const archivos = fs.readdirSync(dir).filter((f) => f.endsWith(".pdf"));
  if (!archivos.length) { console.error("No hay PDF en " + dir); process.exit(1); }
  let ok = 0;
  for (const nombre of archivos) {
    const cuerpo = fs.readFileSync(path.join(dir, nombre));
    const r = await fetch(`${api}/storage/v1/object/recursos/${nombre}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/pdf",
        "x-upsert": "true",
      },
      body: cuerpo,
    });
    if (!r.ok) {
      console.error(`✗ ${nombre}: ${r.status} ${await r.text()}`);
      process.exit(1);
    }
    ok++;
    console.log(`✓ ${nombre} (${Math.round(cuerpo.length / 1024 / 1024)} MB)`);
  }
  console.log(`Listo: ${ok} PDF`);
})();
