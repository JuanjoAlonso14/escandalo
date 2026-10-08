// Asistencia a prácticas: módulo compartido (carga, cálculo, resumen y mapa de calor) y la página /asistencia (solo lectura).
// Los datos viven en la base y solo los ve quien tiene sesión; modificarlos es solo para admins (lo hace cumplir la base).
const Asistencia = (() => {
  const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fecha = (iso, largo) => new Date(iso + "T00:00").toLocaleDateString("es", largo
    ? { weekday: "long", day: "numeric", month: "long", year: "numeric" } : { day: "numeric", month: "short" });

  // Pide todas las filas de una consulta, de a 1000 (el límite de la base por respuesta)
  async function pedirTodo(ruta) {
    const filas = [], cab = await Sesion.headers();
    for (let desde = 0; ; desde += 1000) {
      const r = await fetch(`${SUPABASE.url}/rest/v1/${ruta}&limit=1000&offset=${desde}`, { headers: cab, signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? "No tenés permiso para ver esto." : `Error ${r.status}`);
      const lote = await r.json(); filas.push(...lote);
      if (lote.length < 1000) return filas;
    }
  }
  const cargar = async () => {
    const [practicas, jugadores, asistencias] = await Promise.all([
      pedirTodo("practicas?select=id,fecha,lugar,notas&order=fecha.asc,id.asc"),
      pedirTodo("jugadores?select=id,slug,nombre,apodo,foto,activo&order=nombre.asc"),
      pedirTodo("asistencias?select=practica_id,jugador_id,presente&order=practica_id.asc,jugador_id.asc"),
    ]);
    return { practicas, jugadores, asistencias };
  };

  // Totales por jugador, por práctica y del equipo. "Disponibles" = prácticas que contaban para esa persona.
  function calcular({ practicas, jugadores, asistencias }) {
    const porJugador = new Map(jugadores.map((j) => [j.id, { ...j, disponibles: 0, fue: 0, marcas: new Map() }]));
    const porPractica = new Map(practicas.map((p) => [p.id, { presentes: 0, total: 0 }]));
    for (const a of asistencias) {
      const j = porJugador.get(a.jugador_id), p = porPractica.get(a.practica_id);
      if (!j || !p) continue;
      j.disponibles++; p.total++; j.marcas.set(a.practica_id, a.presente);
      if (a.presente) { j.fue++; p.presentes++; }
    }
    const lista = [...porJugador.values()].filter((j) => j.disponibles > 0).map((j) => ({ ...j, pct: (100 * j.fue) / j.disponibles }));
    const fue = lista.reduce((s, j) => s + j.fue, 0), disp = lista.reduce((s, j) => s + j.disponibles, 0);
    return { lista, porPractica, equipo: { fue, disp, pct: disp ? (100 * fue) / disp : 0 } };
  }
  const ordenar = (lista, modo) => [...lista].sort((a, b) => (modo === "cantidad" ? b.fue - a.fue || b.pct - a.pct : b.pct - a.pct || b.fue - a.fue) || a.nombre.localeCompare(b.nombre, "es"));
  const clasePct = (p) => (p >= 80 ? "alto" : p >= 60 ? "medio" : "bajo");
  const esYo = (j, propio) => propio != null && (j.slug === propio || j.id === propio);

  function tarjetas(datos, c, propio) {
    const yo = propio != null && c.lista.find((j) => esYo(j, propio));
    const ult = datos.practicas[datos.practicas.length - 1], u = ult && c.porPractica.get(ult.id);
    return `<div class="asi-tarjetas">
      <div class="asi-t"><b>${datos.practicas.length}</b><span>Prácticas registradas</span></div>
      <div class="asi-t"><b>${Math.round(c.equipo.pct)}%</b><span>Asistencia del equipo</span></div>
      ${yo ? `<div class="asi-t yo"><b>${Math.round(yo.pct)}%</b><span>Tu asistencia · ${yo.fue} de ${yo.disponibles}</span></div>` : ""}
      ${ult ? `<div class="asi-t"><b>${u.presentes}<small>/${u.total}</small></b><span>Última práctica · ${fecha(ult.fecha)}</span></div>` : ""}
    </div>`;
  }

  const puedeVer = (j, propio, admin) => !!admin || esYo(j, propio);

  function tabla(c, propio, modo, admin) {
    const fila = (j, i) => {
      const click = puedeVer(j, propio, admin);
      return `<tr class="${esYo(j, propio) ? "yo" : ""}${click ? " asi-ver" : ""}" ${click ? `data-ver="${j.id}" tabindex="0" role="button" title="Ver evolución"` : ""}>
      <td class="asi-pos">${i + 1}</td>
      <td><div class="asi-quien"><img src="assets/jugadores/${esc(j.foto)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><span><b>${esc(j.apodo)}</b><small>${esc(j.nombre)}</small></span></div></td>
      <td class="asi-num">${j.fue}<small> de ${j.disponibles}</small></td>
      <td class="asi-barra-celda"><div class="asi-barra ${clasePct(j.pct)}"><i style="width:${j.pct.toFixed(1)}%"></i></div></td>
      <td class="asi-pct ${clasePct(j.pct)}">${Math.round(j.pct)}%</td>
    </tr>`;
    };
    return `<div class="asi-orden"><span>Ordenar por</span>
        <button class="chip ${modo === "pct" ? "on" : ""}" data-orden="pct">Porcentaje</button>
        <button class="chip ${modo === "cantidad" ? "on" : ""}" data-orden="cantidad">Prácticas a las que fue</button></div>
      <div class="asi-tabla"><table>
        <thead><tr><th>#</th><th>Jugador</th><th>Fue</th><th class="asi-barra-celda"></th><th>%</th></tr></thead>
        <tbody>${ordenar(c.lista, modo).map(fila).join("")}</tbody></table></div>
      <p class="asi-nota">El porcentaje cuenta solo las prácticas que había desde que cada uno se sumó al equipo.${admin ? " Tocá un nombre para ver la evolución." : propio ? " Tocá tu nombre para ver tu evolución." : ""}</p>`;
  }

  function mesesDe(practicas) {
    const meses = [];
    for (const p of practicas) {
      const m = +p.fecha.slice(5, 7) - 1, y = p.fecha.slice(0, 4), k = `${y}-${m}`;
      if (!meses.length || meses[meses.length - 1].k !== k) meses.push({ k, nombre: `${MESES[m]} ${y.slice(2)}`, practicas: [] });
      meses[meses.length - 1].practicas.push(p);
    }
    return meses;
  }

  function mapa(datos, c, propio, modo, admin, mesKey) {
    const meses = mesesDe(datos.practicas);
    const todas = mesKey === "todas";
    const mes = todas ? null : meses.find((m) => m.k === mesKey);
    const practicas = todas || !mes ? datos.practicas : mes.practicas;
    const grupos = todas || !mes ? meses : [mes];
    const chips = `<button type="button" class="chip${todas || !mes ? " on" : ""}" data-mes="todas">Todas</button>`
      + meses.map((m) => `<button type="button" class="chip${m.k === mes?.k ? " on" : ""}" data-mes="${m.k}">${m.nombre}</button>`).join("");
    const CEL = 22, NOM = 104, ancho = NOM + practicas.length * CEL;
    const celda = (j, p) => {
      const v = j.marcas.get(p.id), cls = v === undefined ? "na" : v ? "fue" : "falto";
      return `<i class="${cls}" title="${esc(j.apodo)} · ${fecha(p.fecha)}: ${v === undefined ? "no contaba" : v ? "fue" : "faltó"}"></i>`;
    };
    const filas = ordenar(c.lista, modo).map((j) => {
      const click = puedeVer(j, propio, admin);
      return `<div class="asi-fila${esYo(j, propio) ? " yo" : ""}${click ? " asi-ver" : ""}" ${click ? `data-ver="${j.id}"` : ""}><span class="nom">${esc(j.apodo)}</span><span class="celdas">${practicas.map((p) => celda(j, p)).join("")}</span></div>`;
    }).join("");
    return `<div class="asi-meses-sel"><span>Mes</span>${chips}</div>
    <div class="asi-mapa"><div class="asi-mapa-pista" style="width:${ancho}px">
      <div class="asi-cab"><span class="nom"></span><span class="meses">${grupos.map((m) => `<span class="mes" style="width:${m.practicas.length * CEL}px">${m.nombre}</span>`).join("")}</span></div>
      <div class="asi-cab"><span class="nom"></span><span class="celdas">${practicas.map((p) => `<span class="dia">${+p.fecha.slice(8)}</span>`).join("")}</span></div>
      ${filas}
    </div></div>
    <div class="asi-leyenda"><i class="fue"></i> Fue <i class="falto"></i> Faltó <i class="na"></i> No contaba (todavía no estaba)</div>`;
  }

  function historialDe(datos, j) {
    let fue = 0, disp = 0, racha = 0, mejorRacha = 0;
    const pasos = [];
    for (const p of datos.practicas) {
      const v = j.marcas.get(p.id);
      if (v === undefined) continue;
      disp++;
      if (v) { fue++; racha++; if (racha > mejorRacha) mejorRacha = racha; }
      else racha = 0;
      pasos.push({
        fecha: p.fecha, lugar: p.lugar, notas: p.notas,
        estado: v ? "fue" : "falto",
        pct: Math.round((100 * fue) / disp),
        fue, disp,
      });
    }
    return { pasos, mejorRacha, rachaActual: racha };
  }

  function graficaEvo(pasos) {
    if (!pasos.length) return `<p class="asi-evo-vacio">Todavía no tiene prácticas registradas.</p>`;
    const W = 460, H = 240, L = 36, R = 14, T = 18, B = 32;
    const iw = W - L - R, ih = H - T - B, n = pasos.length;
    const xAt = (i) => L + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
    const yAt = (pct) => T + ih - (Math.min(100, Math.max(0, pct)) / 100) * ih;
    const pts = pasos.map((p, i) => [xAt(i), yAt(p.pct)]);
    const linea = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
    const area = `${linea} L${pts[n - 1][0].toFixed(1)},${(T + ih).toFixed(1)} L${pts[0][0].toFixed(1)},${(T + ih).toFixed(1)} Z`;
    const grilla = [0, 25, 50, 75, 100].map((v) => {
      const y = yAt(v);
      return `<line x1="${L}" y1="${y}" x2="${W - R}" y2="${y}" class="g"/><text x="${L - 6}" y="${y + 3.5}" class="gl">${v}%</text>`;
    }).join("");
    const idxs = n === 1 ? [0] : n === 2 ? [0, 1] : [0, Math.floor((n - 1) / 2), n - 1];
    const labels = idxs.map((i) => {
      const d = pasos[i].fecha, txt = `${+d.slice(8)} ${MESES[+d.slice(5, 7) - 1]}`;
      return `<text x="${xAt(i)}" y="${H - 8}" class="xl">${esc(txt)}</text>`;
    }).join("");
    const dots = pasos.map((p, i) => {
      const cx = xAt(i).toFixed(1), cy = yAt(p.pct).toFixed(1);
      return `<g class="asi-evo-punto" data-i="${i}">
        <circle class="hit" cx="${cx}" cy="${cy}" r="10"/>
        <circle class="dot ${p.estado}" cx="${cx}" cy="${cy}" r="${n > 45 ? 3.2 : 4}"/>
      </g>`;
    }).join("");
    const tira = pasos.map((p, i) => `<button type="button" class="asi-evo-cel ${p.estado}" data-i="${i}" aria-label="${esc(fecha(p.fecha))}"></button>`).join("");
    return `
      <div class="asi-evo-chart">
        <div class="asi-evo-tip" hidden></div>
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Porcentaje de asistencia acumulado">
          ${grilla}
          <path d="${area}" class="area"/>
          <path d="${linea}" class="linea"/>
          <line class="asi-evo-cursor" x1="0" y1="${T}" x2="0" y2="${T + ih}" hidden/>
          ${dots}
          ${labels}
        </svg>
        <div class="asi-evo-tira">${tira}</div>
        <div class="asi-evo-ley"><i class="fue"></i> Fue <i class="falto"></i> Faltó <span></div>
      </div>`;
  }

  function cablearGrafica(modal, pasos) {
    const chart = modal.querySelector(".asi-evo-chart");
    if (!chart || !pasos.length) return;
    const tip = chart.querySelector(".asi-evo-tip");
    const cursor = chart.querySelector(".asi-evo-cursor");
    const n = pasos.length, L = 36, R = 14, W = 460, iw = W - L - R;
    const xAt = (i) => L + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);

    const rBase = n > 45 ? 3.2 : 4;
    const mostrar = (i, clientX, clientY) => {
      const p = pasos[i]; if (!p) return;
      chart.querySelectorAll(".asi-evo-punto.on").forEach((el) => {
        el.classList.remove("on");
        el.querySelector(".dot")?.setAttribute("r", rBase);
      });
      chart.querySelectorAll(".asi-evo-cel.on").forEach((el) => el.classList.remove("on"));
      const punto = chart.querySelector(`.asi-evo-punto[data-i="${i}"]`);
      punto?.classList.add("on");
      punto?.querySelector(".dot")?.setAttribute("r", "7");
      chart.querySelector(`.asi-evo-cel[data-i="${i}"]`)?.classList.add("on");
      const x = xAt(i);
      cursor.removeAttribute("hidden");
      cursor.setAttribute("x1", x); cursor.setAttribute("x2", x);
      tip.hidden = false;
      tip.className = "asi-evo-tip " + p.estado;
      tip.innerHTML = `<b>${esc(fecha(p.fecha, true))}</b>
        <span class="est">${p.estado === "fue" ? "Fue" : "Faltó"}</span>
        <span class="pct">${p.pct}% acumulado · ${p.fue}/${p.disp}</span>
        ${p.lugar ? `<small>${esc(p.lugar)}</small>` : ""}`;
      const box = chart.getBoundingClientRect();
      const left = Math.min(Math.max(8, clientX - box.left - tip.offsetWidth / 2), box.width - tip.offsetWidth - 8);
      const top = Math.max(8, clientY - box.top - tip.offsetHeight - 12);
      tip.style.left = left + "px";
      tip.style.top = top + "px";
    };
    const ocultar = () => {
      tip.hidden = true;
      cursor.setAttribute("hidden", "");
      chart.querySelectorAll(".asi-evo-punto.on").forEach((el) => {
        el.classList.remove("on");
        el.querySelector(".dot")?.setAttribute("r", rBase);
      });
      chart.querySelectorAll(".asi-evo-cel.on").forEach((el) => el.classList.remove("on"));
    };

    // Solo puntos de la curva o celdas de la tira (no toda el área del gráfico)
    const sobrePunto = (e) => e.target.closest(".asi-evo-punto[data-i], .asi-evo-cel[data-i]");
    chart.addEventListener("pointerover", (e) => {
      const el = sobrePunto(e); if (!el) return;
      mostrar(+el.dataset.i, e.clientX, e.clientY);
    });
    chart.addEventListener("pointermove", (e) => {
      const el = sobrePunto(e);
      if (el) mostrar(+el.dataset.i, e.clientX, e.clientY);
      else if (!e.target.closest(".asi-evo-tip")) ocultar();
    });
    chart.addEventListener("pointerleave", ocultar);
  }

  function modalEvolucion(datos, j) {
    document.querySelector(".asi-evo-modal")?.remove();
    const { pasos, mejorRacha, rachaActual } = historialDe(datos, j);
    const m = document.createElement("div");
    m.className = "quiz-modal open asi-evo-modal";
    m.innerHTML = `
      <div class="quiz-caja asi-evo">
        <div class="quiz-top">
          <span>Evolución de asistencia</span>
          <button class="quiz-x" data-cerrar type="button" aria-label="Cerrar">${typeof ico === "function" ? ico("cerrar") : "×"}</button>
        </div>
        <div class="asi-evo-cab">
          <img src="assets/jugadores/${esc(j.foto)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
          <div>
            <b>${esc(j.apodo)}</b>
            <small>${esc(j.nombre)}</small>
          </div>
          <div class="asi-evo-tot ${clasePct(j.pct)}"><strong>${Math.round(j.pct)}%</strong><span>${j.fue} de ${j.disponibles}</span></div>
        </div>
        <div class="asi-evo-stats">
          <div><b>${mejorRacha}</b><span>Mejor racha</span></div>
          <div><b>${rachaActual}</b><span>Racha actual</span></div>
          <div><b>${pasos.filter((p) => p.estado === "falto").length}</b><span>Faltas</span></div>
        </div>
        ${graficaEvo(pasos)}
      </div>`;
    document.body.appendChild(m);
    cablearGrafica(m, pasos);
    const cerrar = () => m.remove();
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-cerrar]")) cerrar(); });
    const escKey = (e) => { if (e.key === "Escape") { cerrar(); document.removeEventListener("keydown", escKey); } };
    document.addEventListener("keydown", escKey);
  }

  // Dibuja el resumen completo dentro de un contenedor y conecta el botón de orden
  function montar(el, datos, { propio, admin } = {}) {
    let modo = "pct";
    let mes = "todas";
    const c = calcular(datos);
    const abrir = (id) => {
      const j = c.lista.find((x) => String(x.id) === String(id));
      if (j && puedeVer(j, propio, admin)) modalEvolucion(datos, j);
    };
    const dibujar = () => {
      el.innerHTML = `${tarjetas(datos, c, propio)}
        <h2 class="grupo-ult">Ranking de asistencia</h2>${tabla(c, propio, modo, admin)}
        <h2 class="grupo-ult">Práctica por práctica</h2>${mapa(datos, c, propio, modo, admin, mes)}`;
    };
    el.onclick = (e) => {
      const mesBtn = e.target.closest("[data-mes]"); if (mesBtn) { mes = mesBtn.dataset.mes; dibujar(); return; }
      const b = e.target.closest("[data-orden]"); if (b) { modo = b.dataset.orden; dibujar(); return; }
      const fila = e.target.closest("[data-ver]"); if (fila) abrir(fila.dataset.ver);
    };
    el.onkeydown = (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const fila = e.target.closest("tr[data-ver]"); if (!fila) return;
      e.preventDefault(); abrir(fila.dataset.ver);
    };
    dibujar();
    return c;
  }

  return { cargar, calcular, montar, fecha, esc };
})();

// Página /asistencia: cualquier jugador con sesión puede verla, pero no modificarla
(async () => {
  const raiz = document.querySelector("#asistencia");
  if (!raiz) return;
  const vacio = (t) => (raiz.innerHTML = `<p class="adm-vacio">${t}</p>`);
  if (typeof SUPABASE === "undefined" || !SUPABASE) return vacio("La asistencia todavía no está disponible en el sitio publicado.");
  if (!(await Sesion.token())) { location.href = "/login"; return; }
  try {
    const datos = await Asistencia.cargar();
    if (!datos.practicas.length) return vacio("Todavía no hay prácticas registradas.");
    const s = Sesion.actual() || {};
    const propio = s.jugador_id != null ? s.jugador_id : s.jugador;
    const admin = (await Sesion.rol()) === "admin";
    raiz.innerHTML = `<h1 class="title">Asistencia a <span>prácticas</span></h1><div id="asi-contenido"></div>`;
    Asistencia.montar(raiz.querySelector("#asi-contenido"), datos, { propio, admin });
  } catch (e) { vacio(`No se pudo cargar la asistencia: ${Asistencia.esc(e.message)}`); }
})();
