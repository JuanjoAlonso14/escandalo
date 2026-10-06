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
    if (c.code === "23505" && /fecha/.test(c.message + c.details)) return "Ya hay una práctica registrada en esa fecha.";
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
    await mostrar();
  }

  // Secciones del panel: /admin (jugadores) y /admin#asistencia
  let datosA = null;
  const seccionActual = () => (location.hash === "#asistencia" ? "asistencia" : "jugadores");
  async function mostrar() { return seccionActual() === "asistencia" ? cargarAsistencia() : cargar(); }
  const lateral = (cual) => `
        <aside class="adm-lateral">
          <h2>Panel</h2>
          <a class="${cual === "jugadores" ? "on" : ""}" href="/admin">${ico("usuario")} Jugadores</a>
          <a class="${cual === "asistencia" ? "on" : ""}" href="/admin#asistencia">${ico("calendario")} Asistencia</a>
          <span class="pronto">${ico("trofeo")} Torneos <small>Pronto</small></span>
          <span class="pronto">${ico("disco")} Partidos <small>Pronto</small></span>
        </aside>`;
  addEventListener("hashchange", () => { if (document.querySelector(".adm")) mostrar(); });

  async function cargar() {
    try {
      const r = await pedir("jugadores?select=id,slug,nombre,apodo,foto,numero,nacionalidad,dato,activo,creado_en&order=nombre.asc");
      if (!r.ok) throw new Error(await mensajeError(r));
      jugadores = await r.json();
    } catch (e) { raiz.innerHTML = `<p class="adm-vacio">No se pudo cargar: ${esc(e.message)}</p>`; return; }
    pintar();
  }

  function pintar() {
    const activos = jugadores.filter((j) => j.activo).length;
    raiz.innerHTML = `
      <div class="adm">
        ${lateral("jugadores")}
        <section class="adm-main">
          <div class="adm-cab">
            <div><h1>Jugadores</h1><p>${jugadores.length} en total · ${activos} visibles en el sitio</p></div>
            <button class="btn" data-nuevo>${ico("mas")} Agregar jugador</button>
          </div>
          <div class="adm-tabla">
            <table>
              <thead><tr><th>Jugador</th><th>Apodo</th><th>N°</th><th class="adm-oculta">Nacionalidad</th><th>Visible</th><th></th></tr></thead>
              <tbody>${jugadores.map((j) => `
                <tr class="${j.activo ? "" : "inactivo"}" data-id="${j.id}">
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
                        : await pedir(`jugadores?id=eq.${j.id}`, { method: "PATCH", body: JSON.stringify(cuerpo) });
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
        const r = await pedir(`jugadores?id=eq.${j.id}`, { method: "DELETE" });
        if (!r.ok) throw new Error(await mensajeError(r));
        if (!(await r.json()).length) throw new Error("No tenés permiso para hacer eso.");
        m.remove(); aviso(`${j.apodo} eliminado`); await cargar();
      } catch (er) { m.querySelector(".adm-error").textContent = er.message; e.target.disabled = false; }
    });
  }

  raiz.addEventListener("click", (e) => {
    if (e.target.closest("[data-nuevo]")) return formulario(null);
    const fila = e.target.closest("tr[data-id]"); if (!fila) return;
    const j = jugadores.find((x) => String(x.id) === fila.dataset.id);
    if (e.target.closest("[data-editar]")) formulario(j);
    else if (e.target.closest("[data-borrar]")) confirmarBorrado(j);
  });
  raiz.addEventListener("change", async (e) => {
    const sw = e.target.closest("[data-visible]"); if (!sw) return;
    const j = jugadores.find((x) => String(x.id) === sw.closest("tr").dataset.id);
    try {
      const r = await pedir(`jugadores?id=eq.${j.id}`, { method: "PATCH", body: JSON.stringify({ activo: sw.checked }) });
      if (!r.ok || !(await r.json()).length) throw new Error("No tenés permiso para hacer eso.");
      aviso(sw.checked ? `${j.apodo} ahora es visible` : `${j.apodo} ahora está oculto`); await cargar();
    } catch (er) { sw.checked = !sw.checked; aviso(er.message, true); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.querySelector(".adm-modal")?.remove(); });

  // ---------- Asistencia a prácticas ----------
  const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const lugarSugerido = (iso) => (TEAM.entrenamientos.find((e) => e.dia === DIAS[new Date(iso + "T00:00").getDay()]) || {}).lugar || "";

  async function cargarAsistencia() {
    raiz.innerHTML = '<p class="adm-vacio">Cargando…</p>';
    try { datosA = await Asistencia.cargar(); } catch (e) { raiz.innerHTML = `<p class="adm-vacio">No se pudo cargar: ${esc(e.message)}</p>`; return; }
    pintarAsistencia();
  }

  function pintarAsistencia() {
    const c = Asistencia.calcular(datosA);
    const recientes = [...datosA.practicas].reverse();
    raiz.innerHTML = `
      <div class="adm">
        ${lateral("asistencia")}
        <section class="adm-main">
          <div class="adm-cab">
            <div><h1>Asistencia</h1><p>${datosA.practicas.length} prácticas · ${c.lista.length} jugadores con registros</p></div>
            <button class="btn" data-nueva-practica>${ico("mas")} Agregar práctica</button>
          </div>
          <h2 class="adm-sub">Prácticas</h2>
          <div class="adm-tabla adm-scroll"><table>
            <thead><tr><th>Fecha</th><th class="adm-oculta">Lugar</th><th>Fueron</th><th></th></tr></thead>
            <tbody>${recientes.map((p) => { const t = c.porPractica.get(p.id); return `
              <tr data-practica="${p.id}">
                <td><b>${esc(Asistencia.fecha(p.fecha, true))}</b></td>
                <td class="adm-oculta">${esc(p.lugar || "–")}</td>
                <td>${t.presentes}<small class="asi-de"> de ${t.total}</small></td>
                <td class="adm-acc"><button class="adm-ic" data-editar-practica title="Editar" aria-label="Editar">${ico("editar")}</button><button class="adm-ic peligro" data-borrar-practica title="Eliminar" aria-label="Eliminar">${ico("basura")}</button></td>
              </tr>`; }).join("")}</tbody></table></div>
          <div id="asi-resumen"></div>
        </section>
      </div>`;
    Asistencia.montar(raiz.querySelector("#asi-resumen"), datosA, { admin: true });
  }

  // Estados de cada jugador en una práctica: fue → faltó → no contaba → fue …
  const ESTADOS = { fue: { txt: "Fue", sig: "falto" }, falto: { txt: "Faltó", sig: "nocuenta" }, nocuenta: { txt: "No contaba", sig: "fue" } };

  function formularioPractica(p) {
    const nueva = !p;
    const marcas = new Map();
    for (const a of datosA.asistencias) if (p && a.practica_id === p.id) marcas.set(a.jugador_id, a.presente);
    // En una práctica nueva: los jugadores visibles, todos como "faltó" (se marca quién fue). Al editar: los que tenían registro.
    const lista = datosA.jugadores.filter((j) => (nueva ? j.activo : marcas.has(j.id) || j.activo));
    const estado = (j) => (nueva ? "falto" : marcas.has(j.id) ? (marcas.get(j.id) ? "fue" : "falto") : "nocuenta");
    const iso = nueva ? hoyISO() : p.fecha;
    const m = abrirModal(`
      <div class="quiz-top"><span>${nueva ? "Agregar práctica" : "Editar práctica"}</span><button class="quiz-x" data-cerrar aria-label="Cerrar">${ico("cerrar")}</button></div>
      <form class="adm-form" novalidate>
        <div class="adm-fila">
          <label>Fecha<input name="fecha" type="date" value="${iso}"></label>
          <label>Lugar<input name="lugar" list="lugares" value="${esc(nueva ? lugarSugerido(iso) : p.lugar)}" placeholder="Ej: Facultad de Agronomía"></label>
        </div>
        <datalist id="lugares">${[...new Set(TEAM.entrenamientos.map((e) => e.lugar))].map((l) => `<option value="${esc(l)}">`).join("")}</datalist>
        <label>Notas <small>(opcional)</small><textarea name="notas" rows="1">${esc(p?.notas)}</textarea></label>
        <div class="asi-quienes-cab"><span>¿Quiénes fueron? <small>Tocá cada uno para cambiar</small></span>
          <span class="asi-rapido"><button type="button" data-todos="fue">Todos fueron</button><button type="button" data-todos="falto">Nadie</button></span></div>
        <div class="asi-chips">${lista.map((j) => `
          <button type="button" class="asi-chip" data-id="${j.id}" data-estado="${estado(j)}">
            <img src="assets/jugadores/${esc(j.foto)}" alt="" onerror="this.style.visibility='hidden'">
            <span><b>${esc(j.apodo)}</b><small>${ESTADOS[estado(j)].txt}</small></span></button>`).join("")}</div>
        <p class="asi-cuenta" aria-live="polite"></p>
        <small class="adm-error" aria-live="polite"></small>
        <div class="adm-botones"><button type="button" class="btn ghost" data-cerrar>Cancelar</button><button class="btn" type="submit">${nueva ? "Guardar práctica" : "Guardar cambios"}</button></div>
      </form>`);
    const f = m.querySelector("form"), err = f.querySelector(".adm-error"), cuenta = f.querySelector(".asi-cuenta");
    const contar = () => {
      const chips = [...f.querySelectorAll(".asi-chip")], fue = chips.filter((c) => c.dataset.estado === "fue").length;
      cuenta.textContent = `${fue} de ${chips.filter((c) => c.dataset.estado !== "nocuenta").length} fueron`;
    };
    const poner = (chip, est) => { chip.dataset.estado = est; chip.querySelector("small").textContent = ESTADOS[est].txt; };
    contar();
    let lugarTocado = !nueva;
    f.lugar.addEventListener("input", () => (lugarTocado = true));
    f.fecha.addEventListener("change", () => { if (!lugarTocado) f.lugar.value = lugarSugerido(f.fecha.value); });
    f.addEventListener("click", (e) => {
      const chip = e.target.closest(".asi-chip"); if (chip) { poner(chip, ESTADOS[chip.dataset.estado].sig); contar(); return; }
      const t = e.target.closest("[data-todos]"); if (t) { f.querySelectorAll(".asi-chip").forEach((c) => c.dataset.estado !== "nocuenta" && poner(c, t.dataset.todos)); contar(); }
    });
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); err.textContent = "";
      if (!f.fecha.value) return (err.textContent = "Elegí la fecha de la práctica.");
      const asist = [...f.querySelectorAll(".asi-chip")].filter((c) => c.dataset.estado !== "nocuenta").map((c) => ({ id: Number(c.dataset.id), presente: c.dataset.estado === "fue" }));
      if (!asist.length) return (err.textContent = "Marcá al menos a un jugador.");
      const boton = f.querySelector('[type="submit"]'); boton.disabled = true;
      try {
        const r = await pedir("rpc/guardar_practica", { method: "POST", body: JSON.stringify({ p_id: p ? p.id : null, p_fecha: f.fecha.value,
          p_lugar: f.lugar.value.trim() || null, p_notas: f.notas.value.trim() || null, p_asistencias: asist }) });
        if (!r.ok) throw new Error(await mensajeError(r));
        m.remove(); aviso(nueva ? "Práctica guardada ✓" : "Cambios guardados ✓"); await cargarAsistencia();
      } catch (e2) { err.textContent = e2.message; boton.disabled = false; }
    });
  }

  function confirmarBorradoPractica(p) {
    const m = abrirModal(`
      <div class="quiz-top"><span>Eliminar práctica</span><button class="quiz-x" data-cerrar aria-label="Cerrar">${ico("cerrar")}</button></div>
      <p class="adm-confirma">¿Eliminar la práctica del <b>${esc(Asistencia.fecha(p.fecha, true))}</b>? Se borra también la asistencia de ese día y cambian los porcentajes. No se puede deshacer.</p>
      <small class="adm-error"></small>
      <div class="adm-botones"><button class="btn ghost" data-cerrar>Cancelar</button><button class="btn peligro" data-ok>Eliminar</button></div>`);
    m.querySelector("[data-ok]").addEventListener("click", async (e) => {
      e.target.disabled = true;
      try {
        const r = await pedir(`practicas?id=eq.${p.id}`, { method: "DELETE" });
        if (!r.ok) throw new Error(await mensajeError(r));
        if (!(await r.json()).length) throw new Error("No tenés permiso para hacer eso.");
        m.remove(); aviso("Práctica eliminada"); await cargarAsistencia();
      } catch (er) { m.querySelector(".adm-error").textContent = er.message; e.target.disabled = false; }
    });
  }

  raiz.addEventListener("click", (e) => {
    if (e.target.closest("[data-nueva-practica]")) return formularioPractica(null);
    const fila = e.target.closest("tr[data-practica]"); if (!fila) return;
    const p = datosA.practicas.find((x) => String(x.id) === fila.dataset.practica);
    if (e.target.closest("[data-editar-practica]")) formularioPractica(p);
    else if (e.target.closest("[data-borrar-practica]")) confirmarBorradoPractica(p);
  });

  iniciar();
})();
