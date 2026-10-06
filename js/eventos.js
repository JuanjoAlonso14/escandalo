// Guarda visitas y clicks en public.event (Supabase). Sin base configurada no hace nada.
// Lotea los envíos para no saturar la red; en pagehide manda lo que quede.
(() => {
  if (typeof SUPABASE === "undefined" || !SUPABASE) return;

  const MAX_VALUE = 80;
  const COLA_MAX = 40;
  const FLUSH_MS = 2500;
  let cola = [];
  let timer = null;
  let mandando = false;

  const PAGINAS = {
    "/": "inicio",
    "/galeria": "galeria",
    "/historia": "nosotros",
    "/ultimate": "ultimate",
    "/calendario": "calendario",
    "/login": "login",
    "/admin": "admin",
    "/asistencia": "asistencia",
    "/caja": "caja",
    "/jugadas": "jugadas",
    "/torneo": "torneo",
  };

  const jugadorId = () => {
    try {
      const s = (typeof Sesion !== "undefined" && Sesion.actual && Sesion.actual()) || null;
      const id = s && s.jugador_id;
      return id != null && id !== "" ? Number(id) : null;
    } catch (e) { return null; }
  };

  const limpio = (s) => String(s || "").normalize("NFD").replace(/\p{M}/gu, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 32);

  // /galeria → galeria · /#roster → roster · /jugador/... no aplica (redirige)
  function pagina(href) {
    try {
      const u = new URL(href, location.origin);
      if (u.origin !== location.origin && !href.startsWith("/") && !href.startsWith("#")) {
        return "externo." + limpio(u.hostname);
      }
      const path = (u.pathname.replace(/\/+$/, "") || "/");
      let nombre = PAGINAS[path] || limpio(path.replace(/^\//, "").replace(/\//g, "-")) || "inicio";
      const hash = (u.hash || "").replace(/^#/, "");
      if (!hash) return nombre;
      if (hash.startsWith("j-")) return "carta." + limpio(hash.slice(2));
      if (nombre === "inicio") return limpio(hash) || nombre;
      return nombre + "." + limpio(hash);
    } catch (e) {
      return limpio(href) || "desconocido";
    }
  }

  function describir(el) {
    if (!el || el.nodeType !== 1) return "click";
    const a = el.closest?.("a");
    if (a) {
      const dest = pagina(a.getAttribute("href") || "/");
      if (a.classList.contains("brand")) return "nav.logo";
      if (a.closest("#menu") || a.closest("header.nav")) return "nav." + dest;
      if (a.classList.contains("btn")) return "btn." + dest;
      if (a.classList.contains("dorso-wa")) return "carta.whatsapp";
      if (a.hasAttribute("download")) return "carta.descargar";
      return "link." + dest;
    }
    const btn = el.closest?.("button");
    if (btn) {
      if (btn.id === "burger") return "nav.menu";
      if (btn.closest(".cuenta")) return btn.closest("[data-salir]") ? "cuenta.salir" : "cuenta";
      if (btn.classList.contains("dorso-zoom")) return "carta.ampliar";
      if (btn.classList.contains("dorso-compartir")) return "carta.compartir";
      if (btn.classList.contains("clave-ojito")) return "login.ojito";
      if (btn.type === "submit") {
        const form = btn.closest("form");
        if (form?.id === "form") return "form.sumate";
        if (form?.id === "login-form") return "form.login";
        return "form.enviar";
      }
      const t = limpio(btn.getAttribute("aria-label") || btn.innerText || btn.title);
      return t ? "btn." + t : "btn";
    }
    const input = el.closest?.("input,select,textarea");
    if (input) {
      if (input.type === "password") return "campo.clave";
      return "campo." + (limpio(input.name || input.id) || input.tagName.toLowerCase());
    }
    const carta = el.closest?.(".pcard");
    if (carta) return "carta." + limpio(carta.dataset.slug || "jugador");
    return "click." + limpio(el.id || el.className || el.tagName);
  }

  function encolar(type, value) {
    if (!type) return;
    const jid = jugadorId();
    if (!jid) return;   // solo con sesión de jugador
    cola.push({
      jugador_id: jid,
      type: type,
      value: value == null || value === "" ? null : String(value).slice(0, MAX_VALUE),
    });
    if (cola.length >= COLA_MAX) flush(true);
    else if (!timer) timer = setTimeout(() => flush(false), FLUSH_MS);
  }

  async function flush(forzar) {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!cola.length || (mandando && !forzar)) return;
    const lote = cola.splice(0, COLA_MAX);
    mandando = true;
    try {
      const headers = { apikey: SUPABASE.key, Authorization: `Bearer ${SUPABASE.key}`, "Content-Type": "application/json", Prefer: "return=minimal" };
      try {
        if (typeof Sesion !== "undefined" && Sesion.token) {
          const t = await Sesion.token();
          if (t) headers.Authorization = `Bearer ${t}`;
        }
      } catch (e) {}
      const cuerpo = JSON.stringify(lote);
      if (forzar && navigator.sendBeacon) {
        const url = `${SUPABASE.url}/rest/v1/event?apikey=${encodeURIComponent(SUPABASE.key)}`;
        const ok = navigator.sendBeacon(url, new Blob([cuerpo], { type: "application/json" }));
        if (!ok) throw new Error("beacon");
      } else {
        const r = await fetch(`${SUPABASE.url}/rest/v1/event`, {
          method: "POST",
          headers,
          body: cuerpo,
          keepalive: !!forzar,
          signal: forzar ? undefined : AbortSignal.timeout(8000),
        });
        if (!r.ok) throw new Error("HTTP " + r.status);
      }
    } catch (e) {
      cola = lote.concat(cola).slice(0, COLA_MAX * 2);
      console.warn("eventos:", e.message || e);
    } finally {
      mandando = false;
      if (cola.length) timer = setTimeout(() => flush(false), FLUSH_MS);
    }
  }

  // Visita: al cargar esta página (el click a Galería es "nav.galeria"; el pageview "galeria" llega al entrar a /galeria)
  encolar("pageview", pagina(location.href));
  addEventListener("hashchange", () => encolar("pageview", pagina(location.href)));

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!t || t.closest?.("[data-no-track]")) return;
    const el = t.closest?.("a,button,input,select,textarea,summary,label,[role='button']") || t;
    encolar("click", describir(el));
  }, true);

  addEventListener("pagehide", () => flush(true));
  addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(true); });
})();
