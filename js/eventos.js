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
  // Para el nombre del click: conserva guiones ("agregar-atacante"), no aplasta todo.
  const token = (s) => String(s || "").normalize("NFD").replace(/\p{M}/gu, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

  // data-* que describen la acción. El resto (id, mes, monto) no dice qué se clickeó.
  const DATA_NOMBRE = {
    play: "reproducir", ver: "ver", nueva: "nueva", editar: "editar", borrar: "borrar",
    quitar: "borrar-ficha", deshacer: "deshacer", guardar: "guardar", cerrar: "cerrar",
    ok: "confirmar", "nuevo-paso": "agregar-paso", "borrar-paso": "borrar-paso",
    "nuevo-aporte": "nuevo-aporte", "nuevo-egreso": "nuevo-egreso",
    aporte: "editar-aporte", egreso: "editar-egreso", quiz: "empezar-quiz",
    visible: "cambiar-visible", "nueva-practica": "nueva-practica",
    "editar-practica": "editar-practica", "borrar-practica": "borrar-practica",
    salir: "cerrar-sesion",
  };

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

  const paginaActual = () => (pagina(location.href).split(".")[0] || "sitio");

  // Qué acción es este elemento, mirando data-* conocidos (el botón o un padre).
  function nombreData(el) {
    let n = el;
    for (let i = 0; i < 6 && n && n.nodeType === 1; i++, n = n.parentElement) {
      if (n.hasAttribute?.("data-agregar")) {
        const v = token(n.getAttribute("data-agregar"));
        if (v === "ataque") return "agregar-atacante";
        if (v === "defensa") return "agregar-defensa";
        if (v === "disco") return "agregar-disco";
        return "agregar" + (v ? "-" + v : "");
      }
      if (n.hasAttribute?.("data-paso")) {
        const num = Number(n.getAttribute("data-paso"));
        return "paso-" + (Number.isFinite(num) ? num + 1 : token(n.getAttribute("data-paso")));
      }
      if (n.hasAttribute?.("data-nivel")) return "quiz-nivel-" + token(n.getAttribute("data-nivel"));
      if (n.hasAttribute?.("data-f") && !n.closest?.(".pz-campo")) return "filtro-" + token(n.getAttribute("data-f"));
      for (const [k, nom] of Object.entries(DATA_NOMBRE)) {
        if (n.hasAttribute?.("data-" + k)) return nom;
      }
    }
    return "";
  }

  function nombreForm(btn) {
    const form = btn.closest("form");
    const id = form?.id || "";
    if (id === "form") return "sumate-enviar";
    if (id === "login-form") return "login-entrar";
    if (id === "uni-candado") return "uniformes-desbloquear";
    const texto = token(btn.innerText || btn.getAttribute("aria-label") || "");
    return texto || "enviar-formulario";
  }

  // className en un SVG es un objeto, no texto: por eso aparecía "objectsvganimatedstring".
  function claseTexto(el) {
    const c = el?.getAttribute?.("class");
    return typeof c === "string" ? c : "";
  }

  function describir(el) {
    const pag = paginaActual();
    const marca = (que) => (que ? pag + "." + que : pag + ".click").slice(0, 80);
    if (!el || el.nodeType !== 1) return marca("click");

    const data = nombreData(el);
    if (data) return marca(data);

    const a = el.closest?.("a");
    if (a) {
      const dest = pagina(a.getAttribute("href") || "/");
      if (a.classList.contains("brand")) return marca("logo");
      if (a.closest("#menu") || a.closest("header.nav")) return "nav." + dest;
      if (a.classList.contains("dorso-wa")) return marca("carta-whatsapp");
      if (a.hasAttribute("download")) return marca("carta-descargar");
      if (a.classList.contains("btn")) return marca("ir-" + token(dest));
      return "link." + dest;
    }
    const btn = el.closest?.("button");
    if (btn) {
      if (btn.id === "burger") return marca("abrir-menu");
      if (btn.closest(".cuenta")) return marca(btn.closest("[data-salir]") ? "cerrar-sesion" : "menu-cuenta");
      if (btn.classList.contains("dorso-zoom")) return marca("carta-ampliar");
      if (btn.classList.contains("dorso-compartir")) return marca("carta-compartir");
      if (btn.classList.contains("clave-ojito")) return marca("mostrar-clave");
      if (btn.type === "submit") return marca(nombreForm(btn));
      const t = token(btn.getAttribute("aria-label") || btn.innerText || btn.title);
      if (t) return marca(t);
    }
    const input = el.closest?.("input,select,textarea");
    if (input) {
      if (input.type === "password") return marca("campo-clave");
      const campo = token(input.name || input.id || input.getAttribute("aria-label") || "");
      return marca(campo ? "campo-" + campo : "campo");
    }
    const carta = el.closest?.(".pcard");
    if (carta) return marca("carta-" + token(carta.dataset.slug || "jugador"));
    if (el.closest?.(".pz-campo")) return marca(el.closest("[data-f]") ? "ficha" : "cancha");
    const svg = el.closest?.("svg");
    if (svg) {
      const c = claseTexto(svg).split(/\s+/).find((x) => x && x !== "ico" && !x.startsWith("ico-"));
      if (c) return marca(token(c));
    }
    const id = token(el.id || "");
    if (id) return marca(id);
    const c = claseTexto(el).split(/\s+/).find(Boolean);
    return marca(c ? token(c) : "click");
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
      // RLS: solo JWT del jugador (no anon key / sendBeacon sin Authorization)
      let t = null;
      try { t = typeof Sesion !== "undefined" && Sesion.token ? await Sesion.token() : null; } catch (e) {}
      if (!t) throw new Error("sin sesión");
      const headers = { apikey: SUPABASE.key, Authorization: `Bearer ${t}`, "Content-Type": "application/json", Prefer: "return=minimal" };
      const r = await fetch(`${SUPABASE.url}/rest/v1/event`, {
        method: "POST",
        headers,
        body: JSON.stringify(lote),
        keepalive: !!forzar,
        signal: forzar ? undefined : AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
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
    encolar("click", describir(t));
  }, true);

  addEventListener("pagehide", () => flush(true));
  addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(true); });
})();
