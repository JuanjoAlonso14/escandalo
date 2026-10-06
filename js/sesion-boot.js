// Corre en el <head>, antes del primer pintado: deja listo el nombre en <html>
// para que el placeholder .cuenta-boot se vea sin esperar a sesion.js.
(() => {
  try {
    const s = JSON.parse(localStorage.getItem("escandalo-sesion") || "null");
    if (s && s.nombre) {
      const p = String(s.nombre).trim().split(/\s+/)[0] || "";
      if (p) {
        const root = document.documentElement;
        root.dataset.cuenta = "1";
        root.style.setProperty("--cuenta-nom", JSON.stringify(p));
        root.style.setProperty("--cuenta-ini", JSON.stringify((p[0] || "?").toUpperCase()));
      }
    }
  } catch (e) {}

  // View Transitions MPA: a veces Chrome aborta la transición (nav rápida, bfcache, etc.)
  // y deja un Uncaught (in promise) InvalidStateError aunque la página cargó bien.
  const esAbortVt = (r) => {
    if (!r) return false;
    const msg = r.message || String(r);
    return r.name === "InvalidStateError" && /view\s*transition/i.test(msg);
  };
  addEventListener("unhandledrejection", (e) => { if (esAbortVt(e.reason)) e.preventDefault(); });
  const silenciar = (vt) => {
    if (!vt) return;
    vt.ready?.catch(() => {});
    vt.finished?.catch(() => {});
    vt.updateCallbackDone?.catch(() => {});
  };
  addEventListener("pageswap", (e) => silenciar(e.viewTransition));
  addEventListener("pagereveal", (e) => silenciar(e.viewTransition));
})();
