// Sesión del usuario: menú de cuenta arriba a la derecha (nombre, panel de admin y cerrar sesión).
// Expone window.Sesion para que lo use el panel de administración. Sin base configurada no hace nada.
(() => {
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
      const r = await fetch(`${SUPABASE.url}/rest/v1/perfiles?select=rol&id=eq.${idDelToken(t)}`,
        { headers: { apikey: SUPABASE.key, Authorization: `Bearer ${t}` }, signal: AbortSignal.timeout(5000) });
      const f = await r.json();
      const valor = Array.isArray(f) && f[0] ? f[0].rol : null;
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
  if (!hay || !leer()) return;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const etiqueta = (r) => (r === "admin" ? "Administrador" : "Jugador");
  const nav = document.querySelector("header.nav");
  if (!nav) return;
  const cuenta = document.createElement("div");
  cuenta.className = "cuenta";
  nav.appendChild(cuenta);

  function pintar(rolActual) {
    const s = leer(); if (!s) { cuenta.remove(); return; }
    const primero = s.nombre.split(" ")[0];
    cuenta.innerHTML = `
      <button class="cuenta-btn" type="button" aria-haspopup="true" aria-expanded="false">
        <span class="cuenta-avatar" aria-hidden="true">${esc(primero[0])}</span>
        <span class="cuenta-nombre">${esc(primero)}</span>${ico("chevron")}
      </button>
      <div class="cuenta-menu" role="menu" hidden>
        <div class="cuenta-quien"><b>${esc(s.nombre)}</b><small class="rol-${esc(rolActual || "usuario")}">${etiqueta(rolActual)}</small></div>
        <a role="menuitem" href="/asistencia">${ico("calendario")} Asistencia a prácticas</a>
        ${rolActual === "admin" ? `<a role="menuitem" href="/admin">${ico("panel")} Panel de administración</a>` : ""}
        <button role="menuitem" type="button" data-salir>${ico("salir")} Cerrar sesión</button>
      </div>`;
  }
  pintar(leer().rol);
  rol().then((r) => { if (leer()) pintar(r); else cuenta.remove(); });

  cuenta.addEventListener("click", (e) => {
    const btn = e.target.closest(".cuenta-btn");
    const menu = cuenta.querySelector(".cuenta-menu");
    if (btn) { menu.hidden = !menu.hidden; btn.setAttribute("aria-expanded", String(!menu.hidden)); return; }
    if (e.target.closest("[data-salir]")) cerrar();
  });
  document.addEventListener("click", (e) => { if (!cuenta.contains(e.target)) { const m = cuenta.querySelector(".cuenta-menu"); if (m) m.hidden = true; } });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { const m = cuenta.querySelector(".cuenta-menu"); if (m) m.hidden = true; } });
})();
