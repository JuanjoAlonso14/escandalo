// Sesión del usuario: menú de cuenta arriba a la derecha (nombre, panel de admin y cerrar sesión).
// Expone window.Sesion para que lo use el panel de administración. Sin base configurada no hace nada.
// Ideal: cargar este archivo justo después del <header> para que no parpadee el menú al navegar.
(() => {
  if (window.Sesion) return;   // no inicializar dos veces
  const CLAVE = "escandalo-sesion";
  const hay = typeof SUPABASE !== "undefined" && SUPABASE;
  const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE) || "null"); } catch (e) { return null; } };
  const guardar = (s) => { try { localStorage.setItem(CLAVE, JSON.stringify(s)); } catch (e) {} };
  const borrar = () => { try { localStorage.removeItem(CLAVE); } catch (e) {} };
  const idDelToken = (t) => { try { return JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub; } catch (e) { return null; } };

  // Devuelve un token válido (renovándolo si está por vencer) o null si no hay sesión
  async function token() {
    const s = leer();
    if (!hay || !s) return null;
    if (s.expires_at - Date.now() / 1000 > 60) return s.access_token;
    try {
      const r = await fetch(`${SUPABASE.url}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST", headers: { apikey: SUPABASE.key, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: s.refresh_token }), signal: AbortSignal.timeout(5000) });
      const d = await r.json();
      if (!r.ok || !d.access_token) { borrar(); return null; }       // la sesión ya no sirve
      guardar({ ...s, access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at });
      return d.access_token;
    } catch (e) { return s.access_token; }                            // sin conexión: se intenta con el que hay
  }

  // El rol sale de la base (nunca de lo que haya guardado en el navegador)
  async function rol() {
    const t = await token(); if (!t) return null;
    try {
      const r = await fetch(`${SUPABASE.url}/rest/v1/perfiles?select=rol,jugadores(rol)&id=eq.${idDelToken(t)}`,
        { headers: { apikey: SUPABASE.key, Authorization: `Bearer ${t}` }, signal: AbortSignal.timeout(5000) });
      const f = await r.json();
      const fila = Array.isArray(f) && f[0];
      const anidado = fila && fila.jugadores;
      const deJugador = Array.isArray(anidado) ? anidado[0]?.rol : anidado?.rol;
      const valor = deJugador || (fila && fila.rol === "usuario" ? "jugador" : fila?.rol) || null;
      const s = leer(); if (s && valor && s.rol !== valor) guardar({ ...s, rol: valor });
      return valor;
    } catch (e) { return (leer() || {}).rol || null; }
  }

  async function cerrar() {
    const s = leer();
    try { if (s) await fetch(`${SUPABASE.url}/auth/v1/logout`, { method: "POST", headers: { apikey: SUPABASE.key, Authorization: `Bearer ${s.access_token}` }, signal: AbortSignal.timeout(3000) }); } catch (e) {}
    borrar();
    location.href = location.pathname.startsWith("/admin") ? "/" : location.pathname + location.search + location.hash;
    if (!location.pathname.startsWith("/admin")) location.reload();
  }

  window.Sesion = { actual: leer, token, rol, cerrar, headers: async () => ({ apikey: SUPABASE.key, Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" }) };

  const nav = document.querySelector("header.nav");
  const brand = nav && nav.querySelector(".brand");
  const menuSitio = nav && nav.querySelector("#menu");
  let flechaMenu = null;

  // Logueado: el logo sigue yendo al inicio; solo la flecha abre el menú del sitio
  if (document.documentElement.dataset.cuenta && brand && menuSitio) {
    const nosotros = menuSitio.querySelector('a[href="/historia"]');
    if (nosotros) { nosotros.href = "/jugadas"; nosotros.textContent = "Jugadas"; }
    const ultimate = menuSitio.querySelector('a[href="/ultimate"]');
    if (ultimate) ultimate.textContent = "Reglas";

    const wrap = document.createElement("div");
    wrap.className = "brand-wrap";
    brand.replaceWith(wrap);
    wrap.appendChild(brand);
    flechaMenu = document.createElement("button");
    flechaMenu.type = "button";
    flechaMenu.className = "brand-flecha";
    flechaMenu.setAttribute("aria-label", "Abrir menú");
    flechaMenu.setAttribute("aria-haspopup", "true");
    flechaMenu.setAttribute("aria-expanded", "false");
    flechaMenu.setAttribute("aria-controls", "menu");
    wrap.appendChild(flechaMenu);

    const cerrarSitio = () => {
      menuSitio.classList.remove("open");
      flechaMenu.setAttribute("aria-expanded", "false");
      flechaMenu.setAttribute("aria-label", "Abrir menú");
    };
    flechaMenu.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const abre = !menuSitio.classList.contains("open");
      menuSitio.classList.toggle("open", abre);
      flechaMenu.setAttribute("aria-expanded", String(abre));
      flechaMenu.setAttribute("aria-label", abre ? "Cerrar menú" : "Abrir menú");
      const cm = nav.querySelector(".cuenta-menu");
      if (abre && cm) cm.hidden = true;
    });
    menuSitio.addEventListener("click", (e) => { if (e.target.closest("a")) cerrarSitio(); });
    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target) && !menuSitio.contains(e.target)) cerrarSitio();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarSitio(); });
  }

  if (!hay || !leer()) return;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const etiqueta = (r) => (r === "admin" ? "Administrador" : "Jugador");
  if (!nav) return;
  const cuenta = document.createElement("div");
  cuenta.className = "cuenta";
  // Primero montamos la cuenta real y después sacamos el placeholder del boot (evita un frame vacío)
  nav.appendChild(cuenta);
  nav.querySelectorAll(".cuenta-boot").forEach((el) => el.remove());

  function pintar(rolActual) {
    const s = leer(); if (!s) { cuenta.remove(); return; }
    const primero = s.nombre.split(" ")[0];
    cuenta.innerHTML = `
      <button class="cuenta-btn" type="button" aria-haspopup="true" aria-expanded="false">
        <span class="cuenta-avatar" aria-hidden="true">${esc(primero[0])}</span>
        <span class="cuenta-nombre">${esc(primero)}</span>${ico("chevron")}
      </button>
      <div class="cuenta-menu" role="menu" hidden>
        <div class="cuenta-quien"><b>${esc(s.nombre)}</b><small class="rol-${esc(rolActual || "jugador")}">${etiqueta(rolActual)}</small></div>
        <a role="menuitem" href="/asistencia">${ico("calendario")} Asistencia a prácticas</a>
        <a role="menuitem" href="/caja">${ico("caja")} Caja del equipo</a>
        ${rolActual === "admin" ? `<a role="menuitem" href="/admin">${ico("panel")} Panel de administración</a>` : ""}
        <button role="menuitem" type="button" data-clave>${ico("candado")} Cambiar contraseña</button>
        <button role="menuitem" type="button" data-salir>${ico("salir")} Cerrar sesión</button>
      </div>`;
  }
  const ponerRecursos = () => {
    if (!menuSitio || menuSitio.querySelector('a[href="/recursos"]')) return;
    const ancla = menuSitio.querySelector('a[href="/jugadas"]');
    const rec = document.createElement("a");
    rec.href = "/recursos";
    rec.textContent = "Recursos";
    if (ancla) ancla.after(rec);
    else menuSitio.appendChild(rec);
  };
  const sacarRecursos = () => menuSitio?.querySelector('a[href="/recursos"]')?.remove();

  pintar(leer().rol);
  if (leer().rol === "admin") ponerRecursos();
  rol().then((r) => {
    if (!leer()) { cuenta.remove(); return; }
    pintar(r);
    if (r === "admin") ponerRecursos();
    else sacarRecursos();
  });

  cuenta.addEventListener("click", (e) => {
    const btn = e.target.closest(".cuenta-btn");
    const menu = cuenta.querySelector(".cuenta-menu");
    if (btn) {
      menu.hidden = !menu.hidden;
      btn.setAttribute("aria-expanded", String(!menu.hidden));
      if (!menu.hidden && menuSitio) {
        menuSitio.classList.remove("open");
        if (flechaMenu) {
          flechaMenu.setAttribute("aria-expanded", "false");
          flechaMenu.setAttribute("aria-label", "Abrir menú");
        }
      }
      return;
    }
    if (e.target.closest("[data-clave]")) { menu.hidden = true; abrirClave(); return; }
    if (e.target.closest("[data-salir]")) cerrar();
  });

  function abrirClave() {
    document.querySelector(".clave-modal")?.remove();
    const m = document.createElement("div");
    m.className = "quiz-modal open clave-modal";
    m.innerHTML = `
      <div class="quiz-caja">
        <div class="quiz-top"><span>Cambiar contraseña</span><button class="quiz-x" type="button" data-cerrar aria-label="Cerrar">${ico("cerrar")}</button></div>
        <form class="adm-form" novalidate>
          <label>Contraseña actual<span class="clave-wrap"><input name="actual" type="password" autocomplete="current-password"><button class="clave-ojito" type="button" aria-label="Mostrar contraseña"></button></span></label>
          <label>Nueva contraseña<span class="clave-wrap"><input name="nueva" type="password" autocomplete="new-password" minlength="6"><button class="clave-ojito" type="button" aria-label="Mostrar contraseña"></button></span></label>
          <label>Repetir la nueva<span class="clave-wrap"><input name="repetir" type="password" autocomplete="new-password" minlength="6"><button class="clave-ojito" type="button" aria-label="Mostrar contraseña"></button></span></label>
          <small class="adm-error" aria-live="polite"></small>
          <div class="adm-botones"><button type="button" class="btn ghost" data-cerrar>Cancelar</button><button class="btn" type="submit">Guardar</button></div>
        </form>
      </div>`;
    document.body.appendChild(m);
    const cerrarModal = () => m.remove();
    m.addEventListener("click", (ev) => { if (ev.target === m || ev.target.closest("[data-cerrar]")) cerrarModal(); });
    m.querySelectorAll(".clave-wrap").forEach((wrap) => {
      const input = wrap.querySelector("input"), btn = wrap.querySelector(".clave-ojito");
      const pintarOjo = () => { btn.innerHTML = ico(input.type === "text" ? "ojo-off" : "ojo"); };
      pintarOjo();
      btn.addEventListener("click", () => { input.type = input.type === "password" ? "text" : "password"; pintarOjo(); });
    });
    const f = m.querySelector("form"), err = f.querySelector(".adm-error");
    f.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      err.textContent = "";
      const d = Object.fromEntries(new FormData(f));
      if (!d.actual || !d.nueva) { err.textContent = "Completá la contraseña actual y la nueva."; return; }
      if (d.nueva.length < 6) { err.textContent = "La nueva contraseña tiene que tener al menos 6 caracteres."; return; }
      if (d.nueva !== d.repetir) { err.textContent = "La repetición no coincide."; return; }
      if (d.nueva === d.actual) { err.textContent = "Elegí una contraseña distinta a la actual."; return; }
      const boton = f.querySelector('[type="submit"]');
      boton.disabled = true;
      try {
        const r = await fetch(`${SUPABASE.url}/rest/v1/rpc/cambiar_mi_clave`, {
          method: "POST",
          headers: await Sesion.headers(),
          body: JSON.stringify({ p_actual: d.actual, p_nueva: d.nueva }),
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) {
          let msg = "No se pudo cambiar la contraseña.";
          try { msg = (await r.json()).message || msg; } catch (e2) {}
          throw new Error(msg);
        }
        cerrarModal();
        const t = document.createElement("div");
        t.className = "toast ver"; t.setAttribute("role", "status"); t.textContent = "Contraseña actualizada";
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2400);
      } catch (e2) {
        err.textContent = e2.message;
        boton.disabled = false;
      }
    });
    f.querySelector("input").focus();
  }

  document.addEventListener("click", (e) => { if (!cuenta.contains(e.target)) { const m = cuenta.querySelector(".cuenta-menu"); if (m) m.hidden = true; } });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    document.querySelector(".clave-modal")?.remove();
    const m = cuenta.querySelector(".cuenta-menu"); if (m) m.hidden = true;
  });
})();
