// Corre en el <head>, antes del primer pintado: deja listo el nombre en <html>
// para que el placeholder .cuenta-boot se vea sin esperar a sesion.js.
(() => {
  try {
    const s = JSON.parse(localStorage.getItem("escandalo-sesion") || "null");
    if (!s || !s.nombre) return;
    const p = String(s.nombre).trim().split(/\s+/)[0] || "";
    if (!p) return;
    const root = document.documentElement;
    root.dataset.cuenta = "1";
    root.style.setProperty("--cuenta-nom", JSON.stringify(p));
    root.style.setProperty("--cuenta-ini", JSON.stringify((p[0] || "?").toUpperCase()));
  } catch (e) {}
})();
