// Panel de administración (/admin). Solo para el rol admin. Hoy gestiona jugadores; torneos y partidos vienen después.
// La seguridad real está en las reglas de la base: aunque alguien abra esta página, solo un admin puede modificar datos.
(() => {
  const raiz = document.querySelector("#admin");
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const limpiar = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  let jugadores = [];

  function aviso(texto, mal) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = texto; t.style.borderColor = mal ? "#ff4d6d" : "#2ecc71";
    t.classList.remove("ver"); void t.offsetWidth; t.classList.add("ver");
  }
  const mensajeError = async (r) => {
    let c = {}; try { c = await r.clone().json(); } catch (e) {}
    if (c.code === "23505") return /numero/.test(c.message + c.details) ? "Ya hay otro jugador con ese número de camiseta." : "Ya existe un jugador con ese nombre.";
    if (r.status === 401 || r.status === 403) return "No tenés permiso para hacer eso.";
    return c.message || `Error ${r.status}`;
  };
  async function pedir(ruta, opciones = {}) {
    const r = await fetch(`${SUPABASE.url}/rest/v1/${ruta}`, { ...opciones, headers: { ...(await Sesion.headers()), Prefer: "return=representation", ...(opciones.headers || {}) }, signal: AbortSignal.timeout(8000) });
    return r;
  }

  async function iniciar() {
    if (typeof SUPABASE === "undefined" || !SUPABASE) { raiz.innerHTML = '<p class="adm-vacio">El panel todavía no está disponible en el sitio publicado.</p>'; return; }
    if (!(await Sesion.token())) { location.href = "/login"; return; }
    const r = await Sesion.rol();
    if (r !== "admin") {
      raiz.innerHTML = `<div class="adm-vacio"><h1>Sin acceso</h1><p>Esta sección es solo para administradores.</p><a class="btn" href="/">Volver al inicio</a></div>`;
      return;
    }
    await cargar();
  }

  async function cargar() {
    try {
      const r = await pedir("jugadores?select=*&order=nombre.asc");
      if (!r.ok) throw new Error(await mensajeError(r));
      jugadores = await r.json();
    } catch (e) { raiz.innerHTML = `<p class="adm-vacio">No se pudo cargar: ${esc(e.message)}</p>`; return; }
    pintar();
  }

  function pintar() {
    const activos = jugadores.filter((j) => j.activo).length;
    raiz.innerHTML = `
      <div class="adm">
        <aside class="adm-lateral">
          <h2>Panel</h2>
          <a class="on" href="/admin">${ico("usuario")} Jugadores</a>
          <span class="pronto">${ico("trofeo")} Torneos <small>Pronto</small></span>
          <span class="pronto">${ico("disco")} Partidos <small>Pronto</small></span>
        </aside>
        <section class="adm-main">
          <div class="adm-cab">
            <div><h1>Jugadores</h1><p>${jugadores.length} en total · ${activos} visibles en el sitio</p></div>
            <button class="btn" data-nuevo>${ico("mas")} Agregar jugador</button>
          </div>
          <div class="adm-tabla">
            <table>
              <thead><tr><th>Jugador</th><th>Apodo</th><th>N°</th><th class="adm-oculta">Nacionalidad</th><th>Visible</th><th></th></tr></thead>
              <tbody>${jugadores.map((j) => `
                <tr class="${j.activo ? "" : "inactivo"}" data-slug="${esc(j.slug)}">
                  <td><div class="adm-quien"><img src="assets/jugadores/${esc(j.foto)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><b>${esc(j.nombre)}</b></div></td>
                  <td>${esc(j.apodo)}</td>
                  <td>${j.numero ?? "–"}</td>
                  <td class="adm-oculta">${esc(j.nacionalidad || "–")}</td>
                  <td><label class="adm-switch"><input type="checkbox" data-visible ${j.activo ? "checked" : ""} aria-label="Visible en el sitio"><i></i></label></td>
                  <td class="adm-acc"><button class="adm-ic" data-editar title="Editar" aria-label="Editar">${ico("editar")}</button><button class="adm-ic peligro" data-borrar title="Eliminar" aria-label="Eliminar">${ico("basura")}</button></td>
                </tr>`).join("")}</tbody>
            </table>
          </div>
        </section>
      </div>`;
  }

  function abrirModal(html) {
    document.querySelector(".adm-modal")?.remove();
    const m = document.createElement("div");
    m.className = "quiz-modal open adm-modal";
    m.innerHTML = `<div class="quiz-caja">${html}</div>`;
    document.body.appendChild(m);
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-cerrar]")) m.remove(); });
    return m;
  }

  function formulario(j) {
    const nuevo = !j;
    j = j || { nombre: "", apodo: "", foto: "", numero: "", nacionalidad: "Uruguaya", dato: "", activo: true };
    const m = abrirModal(`
      <div class="quiz-top"><span>${nuevo ? "Agregar jugador" : "Editar jugador"}</span><button class="quiz-x" data-cerrar aria-label="Cerrar">${ico("cerrar")}</button></div>
      <form class="adm-form" novalidate>
        <label>Nombre completo<input name="nombre" value="${esc(j.nombre)}" ${nuevo ? "" : "disabled"} placeholder="Ej: Luis Davila"></label>
        <label>Apodo<input name="apodo" value="${esc(j.apodo)}" placeholder="Ej: Luisito"></label>
        <div class="adm-fila">
          <label>Número de camiseta<input name="numero" type="number" min="0" max="99" value="${j.numero ?? ""}"></label>
          <label>Nacionalidad<input name="nacionalidad" value="${esc(j.nacionalidad)}"></label>
        </div>
        <label>Imagen de la carta <small>(archivo que ya está en assets/jugadores/)</small>
          <input name="foto" value="${esc(j.foto)}" placeholder="luis-davila.webp"></label>
        <label>Dato gracioso<textarea name="dato" rows="2">${esc(j.dato)}</textarea></label>
        <label class="adm-check"><input name="activo" type="checkbox" ${j.activo ? "checked" : ""}> Visible en el sitio</label>
        <small class="adm-error" aria-live="polite"></small>
        <div class="adm-botones"><button type="button" class="btn ghost" data-cerrar>Cancelar</button><button class="btn" type="submit">${nuevo ? "Agregar" : "Guardar"}</button></div>
      </form>`);
    const f = m.querySelector("form"), err = f.querySelector(".adm-error");
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); err.textContent = "";
      const d = Object.fromEntries(new FormData(f));
      const nombre = (nuevo ? d.nombre : j.nombre).trim(), apodo = (d.apodo || "").trim();
      if (nombre.length < 2) return (err.textContent = "Escribí el nombre completo.");
      if (!apodo) return (err.textContent = "Escribí el apodo.");
      const num = d.numero === "" ? null : Number(d.numero);
      if (num !== null && (!Number.isInteger(num) || num < 0 || num > 99)) return (err.textContent = "El número tiene que estar entre 0 y 99.");
      const slug = nuevo ? limpiar(nombre) : j.slug;
      const cuerpo = { nombre, apodo, foto: (d.foto || "").trim() || `${slug}.webp`, numero: num,
        nacionalidad: (d.nacionalidad || "").trim() || null, dato: (d.dato || "").trim() || null, activo: !!d.activo };
      const boton = f.querySelector('[type="submit"]'); boton.disabled = true;
      try {
        const r = nuevo ? await pedir("jugadores", { method: "POST", body: JSON.stringify({ slug, ...cuerpo }) })
                        : await pedir(`jugadores?slug=eq.${encodeURIComponent(j.slug)}`, { method: "PATCH", body: JSON.stringify(cuerpo) });
        if (!r.ok) throw new Error(await mensajeError(r));
        const filas = await r.json();
        if (!filas.length) throw new Error("No tenés permiso para hacer eso.");
        m.remove(); aviso(nuevo ? `${apodo} agregado ✓` : "Cambios guardados ✓"); await cargar();
      } catch (e2) { err.textContent = e2.message; boton.disabled = false; }
    });
    f.querySelector("input").focus();
  }

  function confirmarBorrado(j) {
    const m = abrirModal(`
      <div class="quiz-top"><span>Eliminar jugador</span><button class="quiz-x" data-cerrar aria-label="Cerrar">${ico("cerrar")}</button></div>
      <p class="adm-confirma">¿Eliminar a <b>${esc(j.nombre)}</b>? Se borra de la base y deja de aparecer en el sitio. No se puede deshacer.</p>
      <small class="adm-error"></small>
      <div class="adm-botones"><button class="btn ghost" data-cerrar>Cancelar</button><button class="btn peligro" data-ok>Eliminar</button></div>`);
    m.querySelector("[data-ok]").addEventListener("click", async (e) => {
      e.target.disabled = true;
      try {
        const r = await pedir(`jugadores?slug=eq.${encodeURIComponent(j.slug)}`, { method: "DELETE" });
        if (!r.ok) throw new Error(await mensajeError(r));
        if (!(await r.json()).length) throw new Error("No tenés permiso para hacer eso.");
        m.remove(); aviso(`${j.apodo} eliminado`); await cargar();
      } catch (er) { m.querySelector(".adm-error").textContent = er.message; e.target.disabled = false; }
    });
  }

  raiz.addEventListener("click", (e) => {
    if (e.target.closest("[data-nuevo]")) return formulario(null);
    const fila = e.target.closest("tr[data-slug]"); if (!fila) return;
    const j = jugadores.find((x) => x.slug === fila.dataset.slug);
    if (e.target.closest("[data-editar]")) formulario(j);
    else if (e.target.closest("[data-borrar]")) confirmarBorrado(j);
  });
  raiz.addEventListener("change", async (e) => {
    const sw = e.target.closest("[data-visible]"); if (!sw) return;
    const j = jugadores.find((x) => x.slug === sw.closest("tr").dataset.slug);
    try {
      const r = await pedir(`jugadores?slug=eq.${encodeURIComponent(j.slug)}`, { method: "PATCH", body: JSON.stringify({ activo: sw.checked }) });
      if (!r.ok || !(await r.json()).length) throw new Error("No tenés permiso para hacer eso.");
      aviso(sw.checked ? `${j.apodo} ahora es visible` : `${j.apodo} ahora está oculto`); await cargar();
    } catch (er) { sw.checked = !sw.checked; aviso(er.message, true); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.querySelector(".adm-modal")?.remove(); });

  iniciar();
})();
