// Servidor local para probar el sitio con las mismas URLs limpias que en producción.
//   node scripts/servir.js   ->   http://localhost:8080
const http = require("http");
const fs = require("fs");
const path = require("path");
const tipos = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".jpg": "image/jpeg", ".png": "image/png", ".mp4": "video/mp4", ".json": "application/json" };

http.createServer((req, res) => {
  let ruta = decodeURIComponent(req.url.split("?")[0]);
  if (ruta === "/") ruta = "/index";
  let archivo = path.join(__dirname, "..", ruta);
  if (!path.extname(archivo)) archivo += ".html";
  if (!archivo.startsWith(path.join(__dirname, ".."))) { res.writeHead(403); return res.end(); }
  fs.stat(archivo, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end("404"); }
    const total = st.size, rango = req.headers.range;
    const tipo = tipos[path.extname(archivo)] || "application/octet-stream";
    if (rango) {                       // los videos necesitan "range" para poder adelantarse
      const [a, b] = rango.replace("bytes=", "").split("-");
      const ini = +a, fin = b ? +b : total - 1;
      res.writeHead(206, { "Content-Type": tipo, "Content-Range": `bytes ${ini}-${fin}/${total}`, "Accept-Ranges": "bytes", "Content-Length": fin - ini + 1 });
      fs.createReadStream(archivo, { start: ini, end: fin }).pipe(res);
    } else {
      res.writeHead(200, { "Content-Type": tipo, "Content-Length": total, "Accept-Ranges": "bytes" });
      fs.createReadStream(archivo).pipe(res);
    }
  });
}).listen(8080, () => console.log("Sitio en http://localhost:8080"));
