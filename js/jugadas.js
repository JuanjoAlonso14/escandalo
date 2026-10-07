// Jugadas del equipo (/jugadas): pizarra táctica sobre una cancha de Ultimate.
// Cualquiera con sesión puede verlas y reproducirlas; crear, editar y borrar es solo para admins
// (la regla real está en la base: las políticas de la tabla jugadas exigen es_admin()).
// Formato de jugadas.datos: { fichas: [{ id, tipo, etiqueta }], pasos: [{ pos: { id: { x, y } } }] }
// Las posiciones van de 0 a 1 para que la cancha se pueda dibujar en cualquier tamaño.
(() => {
  const raiz = document.querySelector("#jugadas");
  if (!raiz) return;
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const ANCHO = 37, LARGO = 100, GOL = 18;   // medidas de la cancha en metros (WFDF)
  const MAX_ATK = 7, MAX_DEF = 7, MAX_PASOS = 12;
  // Velocidades de reproducción (ms por tramo y pausa entre pasos)
  const VELOCIDADES = {
    lenta:  { dur: 4200, pausa: 800, etq: "Lenta" },
    media:  { dur: 1600, pausa: 350, etq: "Normal" },
    rapida: { dur: 420,  pausa: 80,  etq: "Rápida" },
  };
  const selectVel = (valor = "media") => `
    <label class="pz-vel">Velocidad
      <select data-vel aria-label="Velocidad de reproducción">
        ${Object.entries(VELOCIDADES).map(([k, v]) =>
          `<option value="${k}"${k === valor ? " selected" : ""}>${v.etq}</option>`).join("")}
      </select>
    </label>`;

  document.querySelector("#year").textContent = new Date().getFullYear();
  const burger = document.querySelector("#burger"), menu = document.querySelector("#menu");
  if (burger && menu) {
    burger.onclick = () => menu.classList.toggle("open");
    menu.addEventListener("click", () => menu.classList.remove("open"));
  }
  if (typeof TEAM !== "undefined") {
    const ig = document.querySelector("#ig"), mail = document.querySelector("#mail");
    if (ig) ig.href = TEAM.instagram;
    if (mail) mail.href = "mailto:" + TEAM.email;
  }

  let jugadas = [], esAdmin = false;
  const vacio = (t) => (raiz.innerHTML = `<p class="adm-vacio">${t}</p>`);

  function aviso(texto, mal) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = texto; t.style.borderColor = mal ? "#ff4d6d" : "#2ecc71";
    t.classList.remove("ver"); void t.offsetWidth; t.classList.add("ver");
  }
  async function pedir(ruta, opciones = {}) {
    return fetch(`${SUPABASE.url}/rest/v1/${ruta}`, {
      ...opciones,
      headers: { ...(await Sesion.headers()), Prefer: "return=representation", ...(opciones.headers || {}) },
      signal: AbortSignal.timeout(8000),
    });
  }
  const mensajeError = async (r) => {
    let c = {}; try { c = await r.clone().json(); } catch (e) {}
    if (c.code === "23505") return "Ya hay una jugada con ese nombre.";
    if (r.status === 401 || r.status === 403) return "No tenés permiso para hacer eso.";
    return c.message || `Error ${r.status}`;
  };
  function abrirModal(html, clase = "") {
    document.querySelector(".adm-modal")?.remove();
    const m = document.createElement("div");
    m.className = `quiz-modal open adm-modal ${clase}`.trim();
    m.innerHTML = `<div class="quiz-caja">${html}</div>`;
    document.body.appendChild(m);
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-cerrar]")) cerrar(m); });
    return m;
  }
  const cerrar = (m) => { pararAnimacion(); m.remove(); };

  // ---------- Cancha ----------
  // La cancha se dibuja acostada: x va a lo largo (100 m, de zona a zona) e y a lo ancho (37 m)
  const clamp01 = (n) => Math.min(1, Math.max(0, Number(n) || 0));
  const metros = (p) => ({ x: clamp01(p.x) * LARGO, y: clamp01(p.y) * ANCHO });

  // La punta de flecha se define una sola vez para todo el documento
  function asegurarDefs() {
    if (document.querySelector("#pz-defs")) return;
    const d = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    d.id = "pz-defs";
    d.setAttribute("aria-hidden", "true");
    const punta = (id, color) => `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 1L9 5L0 9z" fill="${color}"/></marker>`;
    d.innerHTML = `<defs>${punta("pz-punta", "#ffd36b")}${punta("pz-punta-disco", "#f4f4f7")}</defs>`;
    document.body.appendChild(d);
  }

  const campo = (clase = "", attrs = "") => `
    <svg class="pz-campo ${clase}" viewBox="-1.5 -1.5 ${LARGO + 3} ${ANCHO + 3}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Cancha de Ultimate" ${attrs}>
      <rect class="pz-pasto" x="0" y="0" width="${LARGO}" height="${ANCHO}" rx="1"/>
      <rect class="pz-zona" x="0" y="0" width="${GOL}" height="${ANCHO}"/>
      <rect class="pz-zona" x="${LARGO - GOL}" y="0" width="${GOL}" height="${ANCHO}"/>
      <path class="pz-linea" d="M${GOL} 0V${ANCHO}M${LARGO - GOL} 0V${ANCHO}"/>
      <path class="pz-brick" d="M${GOL * 2 - 1} ${ANCHO / 2}h2M${GOL * 2} ${ANCHO / 2 - 1}v2M${LARGO - GOL * 2 - 1} ${ANCHO / 2}h2M${LARGO - GOL * 2} ${ANCHO / 2 - 1}v2"/>
      <g data-flechas></g>
      <g data-fichas></g>
    </svg>`;

  // En pantallas chicas la cancha es angosta: las fichas se dibujan más grandes para poder agarrarlas
  const escalaFichas = () => (innerWidth < 760 ? 1.8 : 1);

  const fichaSvg = (f, k) => {
    const id = esc(f.id), etq = esc(String(f.etiqueta || "").slice(0, 2));
    const grupo = (tipo, clase, dentro) =>
      `<g class="pz-f ${clase}" data-f="${id}" role="img" aria-label="${tipo}${etq ? " " + etq : ""}"><g transform="scale(${k})">${dentro}</g></g>`;
    if (f.tipo === "disco") return grupo("Disco", "pz-disco", `<circle class="pz-agarre" r="2.8"/><ellipse rx="1.7" ry="1.2"/><ellipse class="pz-disco-in" rx=".8" ry=".55"/>`);
    // Ataque y defensa: misma ficha (círculo + número); solo cambia el color
    const jugador = `<circle class="pz-agarre" r="2.8"/><circle class="pz-aro" r="2.1"/><text y=".9">${etq}</text>`;
    if (f.tipo === "defensa") return grupo("Defensa", "pz-def", jugador);
    return grupo("Atacante", "pz-atk", jugador);
  };

  const montar = (svg, d, k = 1) => {
    svg.dataset.k = k;
    svg.querySelector("[data-fichas]").innerHTML = d.fichas.map((f) => fichaSvg(f, k)).join("");
  };

  function ubicar(svg, d, pos) {
    for (const f of d.fichas) {
      const g = svg.querySelector(`[data-f="${f.id}"]`), p = pos[f.id];
      if (!g || !p) { if (g) g.style.display = "none"; continue; }
      g.style.display = "";
      const m = metros(p);
      g.setAttribute("transform", `translate(${m.x.toFixed(2)} ${m.y.toFixed(2)})`);
    }
  }

  // Flechas del movimiento: de dónde venía cada ficha hasta donde está en este paso
  function pintarFlechas(svg, d, desde, hasta) {
    const capa = svg.querySelector("[data-flechas]");
    if (!desde || !hasta) { capa.innerHTML = ""; return; }
    const k = Number(svg.dataset.k) || 1;
    capa.innerHTML = d.fichas.map((f) => {
      const a = desde[f.id], b = hasta[f.id];
      if (!a || !b) return "";
      const p1 = metros(a), p2 = metros(b);
      const largo = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (largo < 8 * k) return "";
      // se recorta en las puntas para que la ficha no tape la flecha
      const ux = (p2.x - p1.x) / largo, uy = (p2.y - p1.y) / largo, pase = f.tipo === "disco";
      const x1 = p1.x + ux * 3 * k, y1 = p1.y + uy * 3 * k, x2 = p2.x - ux * 3.6 * k, y2 = p2.y - uy * 3.6 * k;
      return `<line class="pz-flecha${pase ? " pase" : ""}" x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" marker-end="url(#pz-punta${pase ? "-disco" : ""})"/>`;
    }).join("");
  }

  // ---------- Reproducción ----------
  let animacion = null;
  const pararAnimacion = () => { if (animacion) animacion.cancelar = true; animacion = null; };
  const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const dormir = (ms, yo) => new Promise((ok) => setTimeout(() => ok(!yo.cancelar), ms));

  function tramo(svg, d, a, b, yo, dur) {
    return new Promise((listo) => {
      const t0 = performance.now();
      const cuadro = (ahora) => {
        if (yo.cancelar) return listo(false);
        const t = Math.min(1, (ahora - t0) / dur), k = suave(t), pos = {};
        for (const f of d.fichas) {
          const p1 = a[f.id]; if (!p1) continue;
          const p2 = b[f.id] || p1;
          pos[f.id] = { x: p1.x + (p2.x - p1.x) * k, y: p1.y + (p2.y - p1.y) * k };
        }
        ubicar(svg, d, pos);
        t < 1 ? requestAnimationFrame(cuadro) : listo(true);
      };
      requestAnimationFrame(cuadro);
    });
  }

  async function reproducir(svg, d, alPaso, vel) {
    pararAnimacion();
    const yo = (animacion = { cancelar: false });
    const { dur, pausa } = VELOCIDADES[vel] || VELOCIDADES.media;
    pintarFlechas(svg, d, null, null);
    ubicar(svg, d, d.pasos[0].pos);
    alPaso(0);
    for (let i = 1; i < d.pasos.length; i++) {
      if (!(await tramo(svg, d, d.pasos[i - 1].pos, d.pasos[i].pos, yo, dur))) return false;
      alPaso(i);
      if (!(await dormir(pausa, yo))) return false;
    }
    if (animacion === yo) animacion = null;
    return true;
  }

  // Conecta el botón de play con la barra de pasos de un visor o del editor
  function botonPlay(caja, svg, dameDatos, mostrar) {
    const boton = caja.querySelector("[data-play]");
    const sel = caja.querySelector("[data-vel]");
    const texto = (jugando) => { boton.innerHTML = `${ico(jugando ? "cerrar" : "flecha")} ${jugando ? "Parar" : boton.dataset.texto || "Reproducir"}`; };
    texto(false);
    boton.addEventListener("click", async () => {
      if (animacion) { pararAnimacion(); texto(false); mostrar(0); return; }
      const d = dameDatos();
      if (d.pasos.length < 2) return aviso("Agregá al menos un paso para poder reproducir.", true);
      texto(true);
      if (sel) sel.disabled = true;
      const marcar = (i) => caja.querySelectorAll("[data-paso]").forEach((c) => c.classList.toggle("on", +c.dataset.paso === i));
      const entero = await reproducir(svg, d, marcar, sel ? sel.value : "media");
      texto(false);
      if (sel) sel.disabled = false;
      if (entero) mostrar(d.pasos.length - 1);
    });
  }

  // ---------- Datos ----------
  const pasoVacio = () => ({ pos: {} });
  function normalizar(bruto) {
    const d = bruto && typeof bruto === "object" ? bruto : {};
    const crudas = (Array.isArray(d.fichas) ? d.fichas : [])
      .filter((f) => f && typeof f.id === "string" && /^[a-z0-9]+$/.test(f.id))
      .map((f) => ({ id: f.id, tipo: f.tipo === "disco" || f.tipo === "defensa" ? f.tipo : "ataque", etiqueta: String(f.etiqueta ?? "").slice(0, 2) }));
    const fichas = [];
    let atk = 0, def = 0, disco = false;
    for (const f of crudas) {
      if (f.tipo === "ataque" && atk >= MAX_ATK) continue;
      if (f.tipo === "defensa" && def >= MAX_DEF) continue;
      if (f.tipo === "disco") { if (disco) continue; disco = true; }
      if (f.tipo === "ataque") atk++;
      if (f.tipo === "defensa") def++;
      fichas.push(f);
    }
    const crudos = (Array.isArray(d.pasos) ? d.pasos : []).slice(0, MAX_PASOS).map((p) => {
      const pos = {};
      for (const f of fichas) {
        const v = p && p.pos && p.pos[f.id];
        if (v && isFinite(v.x) && isFinite(v.y)) pos[f.id] = { x: clamp01(v.x), y: clamp01(v.y) };
      }
      return { pos };
    });
    // Un paso igual al anterior no mueve nada: era el "inicio" duplicado como paso 1
    const igual = (a, b) => fichas.every((f) => {
      const p = a[f.id], q = b[f.id];
      if (!p && !q) return true;
      if (!p || !q) return false;
      return Math.hypot(p.x - q.x, p.y - q.y) < 0.015;
    });
    const pasos = [];
    for (const p of crudos) {
      if (!pasos.length || !igual(pasos[pasos.length - 1].pos, p.pos)) pasos.push(p);
    }
    return { fichas, pasos: pasos.length ? pasos : [pasoVacio()] };
  }

  async function cargar() {
    try {
      const r = await pedir("jugadas?select=id,nombre,descripcion,datos,creado_en&order=creado_en.asc");
      if (!r.ok) throw new Error(await mensajeError(r));
      jugadas = await r.json();
    } catch (e) { vacio(`No se pudieron cargar las jugadas: ${esc(e.message)}`); return; }
    pintarLista();
  }

  // ---------- Lista ----------
  const tarjeta = (j) => {
    const d = normalizar(j.datos);
    const pasos = Math.max(0, d.pasos.length - 1);
    return `
      <article class="jg-card" data-id="${j.id}">
        <button class="jg-mini" data-ver aria-label="Ver ${esc(j.nombre)}">
          ${campo("pz-mini", `data-mini="${j.id}"`)}
          <span class="jg-lupa">${ico("flecha")}</span>
        </button>
        <div class="jg-info">
          <h3>${esc(j.nombre)}</h3>
          <p>${j.descripcion ? esc(j.descripcion) : "<i>Sin descripción.</i>"}</p>
          <small>${pasos ? `${pasos} ${pasos === 1 ? "movimiento" : "movimientos"}` : "Sin movimientos"} · ${d.fichas.length} ${d.fichas.length === 1 ? "ficha" : "fichas"}</small>
          <div class="jg-acc">
            <button class="btn ghost" data-ver>Ver y reproducir</button>
            ${esAdmin ? `<button class="adm-ic" data-editar title="Editar" aria-label="Editar">${ico("editar")}</button>
            <button class="adm-ic peligro" data-borrar title="Eliminar" aria-label="Eliminar">${ico("basura")}</button>` : ""}
          </div>
        </div>
      </article>`;
  };

  function pintarLista() {
    raiz.innerHTML = `
      <div class="adm-cab">
        <div>
          <h1 class="title">Jugadas del <span>equipo</span></h1>
          <p class="caja-sub">${jugadas.length ? `${jugadas.length} ${jugadas.length === 1 ? "jugada" : "jugadas"}` : "Pizarra del equipo"} · ${esAdmin ? "podés crear, editar y borrar" : "abrilas y dale play para verlas"}</p>
        </div>
        ${esAdmin ? `<button class="btn" data-nueva>${ico("mas")} Nueva jugada</button>` : ""}
      </div>
      ${jugadas.length
        ? `<div class="jg-grid">${jugadas.map(tarjeta).join("")}</div>`
        : `<p class="adm-vacio">Todavía no hay jugadas cargadas.${esAdmin ? " Creá la primera con “Nueva jugada”." : " Cuando un admin cargue alguna, la vas a ver acá."}</p>`}`;
    for (const j of jugadas) {
      const svg = raiz.querySelector(`[data-mini="${j.id}"]`);
      if (!svg) continue;
      const d = normalizar(j.datos);
      montar(svg, d); ubicar(svg, d, d.pasos[0].pos);
    }
  }

  // ---------- Visor ----------
  const chips = (d, activo = 0) => d.pasos
    .map((p, i) => `<button class="pz-chip${i === activo ? " on" : ""}" data-paso="${i}" title="${i ? "Movimiento" : "Posición inicial"}">Paso ${i + 1}</button>`).join("");

  // Si cambia el tamaño de la pantalla hay que redibujar: las fichas cambian de escala
  function alRedimensionar(m, repintar) {
    const fn = () => {
      if (!m.isConnected) return removeEventListener("resize", fn);
      if (!animacion) repintar();
    };
    addEventListener("resize", fn);
  }

  function mostrarPaso(caja, svg, d, i) {
    const n = Math.max(0, Math.min(d.pasos.length - 1, i));
    caja.querySelectorAll("[data-paso]").forEach((c) => c.classList.toggle("on", +c.dataset.paso === n));
    ubicar(svg, d, d.pasos[n].pos);
    pintarFlechas(svg, d, n ? d.pasos[n - 1].pos : null, n ? d.pasos[n].pos : null);
    return n;
  }

  function verJugada(j) {
    const d = normalizar(j.datos);
    const m = abrirModal(`
      <div class="quiz-top"><span>${esc(j.nombre)}</span><button class="quiz-x" data-cerrar aria-label="Cerrar">${ico("cerrar")}</button></div>
      ${j.descripcion ? `<p class="jg-desc">${esc(j.descripcion)}</p>` : ""}
      ${campo("pz-grande", "data-campo")}
      <div class="pz-barra">
        <button class="btn" data-play data-texto="Reproducir"></button>
        ${selectVel("media")}
        <div class="pz-pasos">${chips(d)}</div>
      </div>
      <p class="pz-ayuda">El paso 1 es la salida. En los siguientes se ve de dónde viene cada ficha. El disco va con la flecha punteada.</p>`, "pz-modal");
    const svg = m.querySelector("[data-campo]");
    let paso = 0;
    const repintar = () => { montar(svg, d, escalaFichas()); paso = mostrarPaso(m, svg, d, paso); };
    repintar();
    alRedimensionar(m, repintar);
    botonPlay(m, svg, () => d, (i) => { paso = i; mostrarPaso(m, svg, d, i); });
    m.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-paso]");
      if (!chip) return;
      pararAnimacion();
      paso = mostrarPaso(m, svg, d, +chip.dataset.paso);
    });
  }

  // ---------- Editor (solo admin) ----------
  function editor(j) {
    const nuevo = !j;
    const d = normalizar(j && j.datos);
    const ed = { paso: 0, sel: null, n: d.fichas.reduce((max, f) => Math.max(max, Number(String(f.id).slice(1)) || 0), 0) };

    const m = abrirModal(`
      <div class="quiz-top"><span>${nuevo ? "Nueva jugada" : "Editar jugada"}</span><button class="quiz-x" data-cerrar aria-label="Cerrar">${ico("cerrar")}</button></div>
      <form class="adm-form pz-form" novalidate>
        <label>Nombre<input name="nombre" maxlength="80" value="${esc(j ? j.nombre : "")}" placeholder="Ej: Vertical con corte al break"></label>
        <label>Descripción<textarea name="descripcion" rows="2" maxlength="600" placeholder="Qué busca la jugada, quién corta primero, dónde termina el disco…">${esc(j ? j.descripcion : "")}</textarea></label>
      </form>
      <div class="pz-tools">
        <button class="btn ghost" data-agregar="ataque">${ico("mas")} Atacante</button>
        <button class="btn ghost" data-agregar="defensa">${ico("mas")} Defensa</button>
        <button class="btn ghost" data-agregar="disco">${ico("disco")} Disco</button>
        <label class="pz-etq">N° de ficha<input data-etiqueta maxlength="2" placeholder="1" aria-label="Número o letra de la ficha" disabled></label>
        <button class="btn ghost peligro" data-quitar disabled>${ico("basura")} Borrar ficha</button>
        <button class="btn ghost" data-deshacer disabled>Deshacer</button>
      </div>
      ${campo("pz-grande pz-edita", "data-campo")}
      <div class="pz-barra">
        <div class="pz-pasos" data-chips></div>
        <div class="pz-barra-acc">
          <button class="btn ghost" data-nuevo-paso>${ico("mas")} Agregar paso</button>
          <button class="btn ghost" data-borrar-paso>${ico("basura")} Borrar paso</button>
          ${selectVel("media")}
          <button class="btn ghost" data-play data-texto="Probar"></button>
        </div>
      </div>
      <p class="pz-ayuda">El paso 1 es la posición inicial. Agregá un paso y mové las fichas: ese es el movimiento siguiente. Tocá una ficha para borrarla. Deshacer revierte el último cambio.</p>
      <small class="adm-error" aria-live="polite"></small>
      <div class="adm-botones">
        <button class="btn ghost" data-cerrar>Cancelar</button>
        <button class="btn" data-guardar>${nuevo ? "Crear jugada" : "Guardar cambios"}</button>
      </div>`, "pz-modal pz-editor");

    const svg = m.querySelector("[data-campo]");
    const err = m.querySelector(".adm-error");
    m.querySelector("form").addEventListener("submit", (e) => e.preventDefault());
    const entradaEtq = m.querySelector("[data-etiqueta]");
    const botonQuitar = m.querySelector("[data-quitar]");
    const botonDeshacer = m.querySelector("[data-deshacer]");
    const historial = [];   // snapshots para Deshacer / Ctrl+Z
    const clonar = () => ({
      fichas: d.fichas.map((f) => ({ ...f })),
      pasos: d.pasos.map((p) => {
        const pos = {};
        for (const [id, v] of Object.entries(p.pos)) pos[id] = { ...v };
        return { pos };
      }),
      paso: ed.paso,
      sel: ed.sel,
      n: ed.n,
    });
    const recordar = () => {
      historial.push(clonar());
      if (historial.length > 40) historial.shift();
      botonDeshacer.disabled = false;
    };
    const deshacer = () => {
      const prev = historial.pop();
      if (!prev) return;
      d.fichas = prev.fichas;
      d.pasos = prev.pasos;
      ed.paso = prev.paso;
      ed.sel = prev.sel;
      ed.n = prev.n;
      botonDeshacer.disabled = !historial.length;
      refrescar();
    };

    const marcarSel = () => {
      svg.querySelectorAll("[data-f]").forEach((g) => g.classList.toggle("sel", g.dataset.f === ed.sel));
      const f = d.fichas.find((x) => x.id === ed.sel);
      entradaEtq.disabled = !f || f.tipo === "disco";
      entradaEtq.value = f && f.tipo !== "disco" ? f.etiqueta || "" : "";
      botonQuitar.disabled = !f;
    };
    const refrescar = () => {
      const nAtk = d.fichas.filter((f) => f.tipo === "ataque").length;
      const nDef = d.fichas.filter((f) => f.tipo === "defensa").length;
      const btnAtk = m.querySelector('[data-agregar="ataque"]');
      const btnDef = m.querySelector('[data-agregar="defensa"]');
      btnAtk.innerHTML = `${ico("mas")} Atacante (${nAtk}/${MAX_ATK})`;
      btnDef.innerHTML = `${ico("mas")} Defensa (${nDef}/${MAX_DEF})`;
      btnAtk.disabled = nAtk >= MAX_ATK;
      btnDef.disabled = nDef >= MAX_DEF;
      m.querySelector('[data-agregar="disco"]').disabled = d.fichas.some((f) => f.tipo === "disco");
      m.querySelector("[data-chips]").innerHTML = chips(d, ed.paso);
      m.querySelector("[data-borrar-paso]").disabled = d.pasos.length < 2;
      montar(svg, d, escalaFichas());
      ed.paso = mostrarPaso(m, svg, d, ed.paso);
      marcarSel();
    };
    alRedimensionar(m, refrescar);

    // Fichas nuevas: aparecen en todos los pasos, repartidas a lo ancho para que no se tapen
    const librePara = (tipo, n) => {
      if (tipo === "disco") return { x: 0.3, y: 0.5 };
      return { x: clamp01((tipo === "defensa" ? 0.48 : 0.36) + Math.floor(n / 5) * 0.07), y: clamp01(0.15 + (n % 5) * 0.175) };
    };
    m.querySelectorAll("[data-agregar]").forEach((b) => b.addEventListener("click", () => {
      const tipo = b.dataset.agregar;
      if (tipo === "disco" && d.fichas.some((f) => f.tipo === "disco")) return aviso("La jugada ya tiene un disco.", true);
      const cuantas = d.fichas.filter((f) => f.tipo === tipo).length;
      if (tipo === "ataque" && cuantas >= MAX_ATK) return aviso(`Máximo ${MAX_ATK} atacantes.`, true);
      if (tipo === "defensa" && cuantas >= MAX_DEF) return aviso(`Máximo ${MAX_DEF} defensas.`, true);
      recordar();
      const id = tipo === "disco" ? "disco" : `f${++ed.n}`;
      d.fichas.push({ id, tipo, etiqueta: tipo === "disco" ? "" : String(cuantas + 1).slice(0, 2) });
      const p = librePara(tipo, cuantas);
      for (const paso of d.pasos) paso.pos[id] = { ...p };
      ed.sel = id;
      refrescar();
    }));

    entradaEtq.addEventListener("input", () => {
      const f = d.fichas.find((x) => x.id === ed.sel);
      if (!f) return;
      f.etiqueta = entradaEtq.value.replace(/[^0-9A-Za-zÀ-ÿ]/g, "").slice(0, 2);
      montar(svg, d, escalaFichas()); mostrarPaso(m, svg, d, ed.paso); marcarSel();
    });
    const borrarFicha = () => {
      if (!ed.sel) return aviso("Tocá una ficha para seleccionarla y después borrarla.", true);
      recordar();
      d.fichas = d.fichas.filter((f) => f.id !== ed.sel);
      for (const paso of d.pasos) delete paso.pos[ed.sel];
      ed.sel = null;
      refrescar();
    };
    botonQuitar.addEventListener("click", borrarFicha);
    botonDeshacer.addEventListener("click", deshacer);

    m.querySelector("[data-nuevo-paso]").addEventListener("click", () => {
      if (d.pasos.length >= MAX_PASOS) return aviso(`Máximo ${MAX_PASOS} pasos.`, true);
      recordar();
      const copia = {};
      for (const [id, p] of Object.entries(d.pasos[ed.paso].pos)) copia[id] = { ...p };
      d.pasos.splice(ed.paso + 1, 0, { pos: copia });
      ed.paso++;
      refrescar();
    });
    m.querySelector("[data-borrar-paso]").addEventListener("click", () => {
      if (d.pasos.length < 2) return;
      recordar();
      d.pasos.splice(ed.paso, 1);
      ed.paso = Math.min(ed.paso, d.pasos.length - 1);
      refrescar();
    });
    m.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-paso]");
      if (!chip) return;
      pararAnimacion();
      ed.paso = +chip.dataset.paso;
      refrescar();
    });

    // Arrastre de fichas: solo cambia la posición en el paso que se está editando
    const aCampo = (ev) => {
      const pt = svg.createSVGPoint();
      pt.x = ev.clientX; pt.y = ev.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      return { x: clamp01(p.x / LARGO), y: clamp01(p.y / ANCHO) };
    };
    let arrastre = null, arrastreInicio = null;
    svg.addEventListener("pointerdown", (e) => {
      const g = e.target.closest("[data-f]");
      ed.sel = g ? g.dataset.f : null;
      marcarSel();
      if (!g) return;
      arrastre = g.dataset.f;
      const p = d.pasos[ed.paso].pos[arrastre];
      arrastreInicio = p ? { ...p } : null;
      recordar();
      pararAnimacion();
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });
    svg.addEventListener("pointermove", (e) => {
      if (!arrastre) return;
      d.pasos[ed.paso].pos[arrastre] = aCampo(e);
      ubicar(svg, d, d.pasos[ed.paso].pos);
      pintarFlechas(svg, d, ed.paso ? d.pasos[ed.paso - 1].pos : null, ed.paso ? d.pasos[ed.paso].pos : null);
    });
    const soltar = (e) => {
      if (!arrastre) return;
      const fin = d.pasos[ed.paso].pos[arrastre];
      // Si no se movió de verdad, sacamos el snapshot vacío del historial
      if (arrastreInicio && fin && Math.hypot(fin.x - arrastreInicio.x, fin.y - arrastreInicio.y) < 0.01) historial.pop();
      botonDeshacer.disabled = !historial.length;
      arrastre = null;
      arrastreInicio = null;
      try { svg.releasePointerCapture?.(e.pointerId); } catch (err) {}
    };
    svg.addEventListener("pointerup", soltar);
    svg.addEventListener("pointercancel", soltar);

    // Delete / Supr borra la ficha; Ctrl+Z deshace
    const teclas = (e) => {
      if (!m.isConnected) return removeEventListener("keydown", teclas);
      if (e.target.closest("input,textarea")) return;
      if ((e.key === "Delete" || e.key === "Backspace") && ed.sel) { e.preventDefault(); borrarFicha(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); deshacer(); }
    };
    addEventListener("keydown", teclas);

    botonPlay(m, svg, () => d, (i) => { ed.paso = i; refrescar(); });

    m.querySelector("[data-guardar]").addEventListener("click", async (ev) => {
      err.textContent = "";
      const f = m.querySelector("form");
      const nombre = f.nombre.value.trim(), descripcion = f.descripcion.value.trim();
      if (nombre.length < 3) return (err.textContent = "Ponele un nombre a la jugada.");
      if (!d.fichas.length) return (err.textContent = "Agregá al menos una ficha a la cancha.");
      const cuerpo = { nombre, descripcion: descripcion || null, datos: { fichas: d.fichas, pasos: d.pasos } };
      ev.target.disabled = true;
      try {
        const r = nuevo
          ? await pedir("jugadas", { method: "POST", body: JSON.stringify(cuerpo) })
          : await pedir(`jugadas?id=eq.${j.id}`, { method: "PATCH", body: JSON.stringify(cuerpo) });
        if (!r.ok) throw new Error(await mensajeError(r));
        if (!(await r.json()).length) throw new Error("No tenés permiso para hacer eso.");
        cerrar(m); aviso(nuevo ? "Jugada creada ✓" : "Cambios guardados ✓"); await cargar();
      } catch (e2) { err.textContent = e2.message; ev.target.disabled = false; }
    });

    refrescar();
    m.querySelector('input[name="nombre"]').focus();
  }

  function confirmarBorrado(j) {
    const m = abrirModal(`
      <div class="quiz-top"><span>Eliminar jugada</span><button class="quiz-x" data-cerrar aria-label="Cerrar">${ico("cerrar")}</button></div>
      <p class="adm-confirma">¿Borrar <b>${esc(j.nombre)}</b>? Se va de la pizarra para todo el equipo y no se puede deshacer.</p>
      <small class="adm-error"></small>
      <div class="adm-botones"><button class="btn ghost" data-cerrar>Cancelar</button><button class="btn peligro" data-ok>Eliminar</button></div>`);
    m.querySelector("[data-ok]").addEventListener("click", async (e) => {
      e.target.disabled = true;
      try {
        const r = await pedir(`jugadas?id=eq.${j.id}`, { method: "DELETE" });
        if (!r.ok) throw new Error(await mensajeError(r));
        if (!(await r.json()).length) throw new Error("No tenés permiso para hacer eso.");
        cerrar(m); aviso("Jugada eliminada"); await cargar();
      } catch (er) { m.querySelector(".adm-error").textContent = er.message; e.target.disabled = false; }
    });
  }

  raiz.addEventListener("click", (e) => {
    if (e.target.closest("[data-nueva]")) return editor(null);
    const card = e.target.closest(".jg-card[data-id]");
    if (!card) return;
    const j = jugadas.find((x) => String(x.id) === card.dataset.id);
    if (!j) return;
    if (e.target.closest("[data-editar]")) editor(j);
    else if (e.target.closest("[data-borrar]")) confirmarBorrado(j);
    else if (e.target.closest("[data-ver]")) verJugada(j);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const m = document.querySelector(".adm-modal");
    if (m) cerrar(m);
  });

  (async () => {
    if (typeof SUPABASE === "undefined" || !SUPABASE) { vacio("Las jugadas todavía no están disponibles en el sitio publicado."); return; }
    if (!(await Sesion.token())) { location.href = "/login"; return; }
    asegurarDefs();
    esAdmin = (await Sesion.rol()) === "admin";
    await cargar();
  })();
})();
